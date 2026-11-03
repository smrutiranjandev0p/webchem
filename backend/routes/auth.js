const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const otpLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false });
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = user => ({ _id:String(user._id), username:user.username, email:user.email, avatar:user.avatar, role:user.role, stats:user.stats, createdAt:user.createdAt });
const normalizeEmail = email => String(email || '').trim().toLowerCase();
const hashOtp = (email, purpose, code) => crypto.createHash('sha256').update(email+'|'+purpose+'|'+code+'|'+process.env.OTP_SECRET).digest('hex');
const transporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error('Email delivery is not configured. Set SMTP settings on staging.');
  return nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:String(process.env.SMTP_SECURE||'false')==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
};
async function sendOtp(email, code, purpose) {
  const subject = purpose==='register'?'Verify your WebChem email':'Your WebChem password reset code';
  await transporter().sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:email,subject,text:'Your WebChem verification code is '+code+'. It expires in 10 minutes. Do not share this code with anyone.',html:'<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;border:1px solid #dce5e9;border-radius:14px"><h2>WebChem verification</h2><p>Your one-time verification code is:</p><div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 0">'+code+'</div><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>'});
}
async function issueOtp(email,purpose,extra={}) {
  if (!process.env.OTP_SECRET || process.env.OTP_SECRET.length < 32) throw new Error('OTP_SECRET must be configured with at least 32 characters.');
  const Otp = require('../models/AuthOtp');
  const code = String(crypto.randomInt(0,1000000)).padStart(6,'0');
  await Otp.deleteMany({email,purpose});
  await Otp.create({email,purpose,codeHash:hashOtp(email,purpose,code),...extra,expiresAt:new Date(Date.now()+10*60*1000)});
  try { await sendOtp(email,code,purpose); }
  catch(e) { await Otp.deleteMany({email,purpose}); throw e; }
}
async function consumeOtp(email,purpose,code) {
  const Otp = require('../models/AuthOtp');
  const doc = await Otp.findOne({email,purpose,expiresAt:{$gt:new Date()}});
  if(!doc) return {error:'Code expired or not found. Request a new OTP.'};
  if(doc.attempts>=5){await doc.deleteOne();return {error:'Too many incorrect attempts. Request a new OTP.'};}
  const ok = crypto.timingSafeEqual(Buffer.from(doc.codeHash),Buffer.from(hashOtp(email,purpose,String(code||''))));
  if(!ok){doc.attempts+=1;await doc.save();return {error:'Incorrect OTP. Please try again.'};}
  return {doc};
}
router.get('/config',(req,res)=>res.json({success:true,googleClientId:process.env.GOOGLE_CLIENT_ID||''}));
router.post('/register',otpLimit,async(req,res)=>{
  try{
    const username=String(req.body?.username||'').trim(),email=normalizeEmail(req.body?.email),password=req.body?.password;
    if(!/^[a-zA-Z0-9 _.-]{3,40}$/.test(username)||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<10||password.length>128||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))
      return res.status(400).json({success:false,error:'Use a valid email, username (3–40 characters) and password (10+ characters with letters and numbers).'});
    if(await User.findOne({$or:[{email},{username}]}))return res.status(409).json({success:false,error:'This email or username is already registered. Sign in or reset your password.'});
    await issueOtp(email,'register',{username,passwordHash:await bcrypt.hash(password,12)});
    return res.json({success:true,otpRequired:true,message:'Verification code sent to your email.'});
  }catch(e){console.error('Registration OTP error:',e.message);return res.status(503).json({success:false,error:e.message.includes('Email delivery')?e.message:'Could not send verification email. Please try again.'});}
});
router.post('/verify-registration',otpLimit,async(req,res)=>{
  try{
    const email=normalizeEmail(req.body?.email),code=String(req.body?.otp||'');
    const check=await consumeOtp(email,'register',code);if(check.error)return res.status(400).json({success:false,error:check.error});
    const pending=check.doc;
    if(await User.findOne({$or:[{email},{username:pending.username}]})){await pending.deleteOne();return res.status(409).json({success:false,error:'Email or username is already registered.'});}
    const user=await User.create({username:pending.username,email,password:pending.passwordHash,passwordIsHashed:true,emailVerified:true});
    await pending.deleteOne();
    return res.status(201).json({success:true,token:generateToken(user._id),user:publicUser(user)});
  }catch(e){console.error('Registration verification error:',e.message);return res.status(500).json({success:false,error:'Could not verify account. Please try again.'});}
});
router.post('/login',loginLimit,async(req,res)=>{
  try{
    const email=normalizeEmail(req.body?.email),password=req.body?.password;
    if(!email||typeof password!=='string'||!password)return res.status(400).json({success:false,error:'Email and password are required.'});
    const user=await User.findOne({email}).select('+password');
    if(!user||!(await user.comparePassword(password)))return res.status(401).json({success:false,error:'Invalid email or password.'});
    if(user.emailVerified===false)return res.status(403).json({success:false,error:'Please verify your email before signing in.'});
    return res.json({success:true,token:generateToken(user._id),user:publicUser(user)});
  }catch(e){return res.status(500).json({success:false,error:'Unable to sign in right now.'});}
});
router.post('/resend-registration-otp',otpLimit,async(req,res)=>{
  try{const email=normalizeEmail(req.body?.email);const Otp=require('../models/AuthOtp');const pending=await Otp.findOne({email,purpose:'register',expiresAt:{$gt:new Date()}});if(!pending)return res.status(404).json({success:false,error:'Registration request expired. Please start again.'});const code=String(crypto.randomInt(0,1000000)).padStart(6,'0');pending.codeHash=hashOtp(email,'register',code);pending.attempts=0;pending.expiresAt=new Date(Date.now()+10*60*1000);await pending.save();await sendOtp(email,code,'register');return res.json({success:true,message:'A new verification code has been sent.'});}catch(e){return res.status(503).json({success:false,error:'Could not resend OTP. Please try again.'});}
});
router.post('/forgot-password',otpLimit,async(req,res)=>{
  try{
    const email=normalizeEmail(req.body?.email),user=await User.findOne({email}).select('+password');
    if(user&&user.password)await issueOtp(email,'reset');
    return res.json({success:true,message:'If an account with a password exists, a reset code has been sent.'});
  }catch(e){console.error('Password reset OTP error:',e.message);return res.status(503).json({success:false,error:'Could not send reset email. Please try again.'});}
});
router.post('/reset-password',otpLimit,async(req,res)=>{
  try{
    const email=normalizeEmail(req.body?.email),otp=String(req.body?.otp||''),password=req.body?.password;
    if(typeof password!=='string'||password.length<10||password.length>128||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))return res.status(400).json({success:false,error:'New password must be at least 10 characters and contain letters and numbers.'});
    const check=await consumeOtp(email,'reset',otp);if(check.error)return res.status(400).json({success:false,error:check.error});
    const user=await User.findOne({email}).select('+password');if(!user||!user.password){await check.doc.deleteOne();return res.status(400).json({success:false,error:'Password reset is not available for this account.'});}
    user.password=password;await user.save();await check.doc.deleteOne();
    return res.json({success:true,message:'Password updated. Please sign in with your new password.'});
  }catch(e){console.error('Password reset error:',e.message);return res.status(500).json({success:false,error:'Could not reset password. Please try again.'});}
});
router.post('/google',loginLimit,async(req,res)=>{
  try{
    const credential=String(req.body?.credential||'');
    if(!credential||!process.env.GOOGLE_CLIENT_ID)return res.status(503).json({success:false,error:'Google Sign-In is not configured yet.'});
    const ticket=await googleClient.verifyIdToken({idToken:credential,audience:process.env.GOOGLE_CLIENT_ID});
    const payload=ticket.getPayload();
    if(!payload?.sub||!payload.email||!payload.email_verified)return res.status(401).json({success:false,error:'Google account email is not verified.'});
    const email=normalizeEmail(payload.email);
    // Use Google's stable subject as the federated identity key; never trust email alone.
    let user=await User.findOne({googleId:payload.sub});
    if(!user){
      const existingEmailUser=await User.findOne({email});
      if(existingEmailUser){
        // Google is authoritative for Gmail addresses and verified Workspace accounts.
        // For other third-party email addresses, require the user to authenticate to
        // their existing WebChem account before linking a Google identity.
        const googleIsAuthoritative=email.endsWith('@gmail.com')||Boolean(payload.hd);
        if(!googleIsAuthoritative){
          return res.status(409).json({success:false,error:'An account with this email already exists. Sign in with your WebChem password before linking Google.'});
        }
        if(existingEmailUser.googleId&&existingEmailUser.googleId!==payload.sub){
          return res.status(409).json({success:false,error:'This WebChem account is linked to a different Google account.'});
        }
        existingEmailUser.googleId=payload.sub;
        existingEmailUser.emailVerified=true;
        if(!existingEmailUser.avatar&&payload.picture)existingEmailUser.avatar=payload.picture;
        await existingEmailUser.save();
        user=existingEmailUser;
      }else{
        const base=String(payload.name||email.split('@')[0]).replace(/[^a-zA-Z0-9 _.-]/g,'').trim().slice(0,32)||'WebChem learner';
        let username=base,idx=1;
        while(await User.exists({username}))username=(base.slice(0,34)+'_'+idx++);
        user=await User.create({username,email,googleId:payload.sub,emailVerified:true,avatar:payload.picture});
      }
    }
    return res.json({success:true,token:generateToken(user._id),user:publicUser(user)});
  }catch(e){console.error('Google Sign-In error:',e.message);return res.status(401).json({success:false,error:'Google Sign-In could not be completed.'});}
});
router.get('/me',protect,async(req,res)=>res.json({success:true,user:publicUser(req.user)}));
module.exports=router;
