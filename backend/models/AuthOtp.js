const mongoose=require('mongoose');
const authOtpSchema=new mongoose.Schema({
 email:{type:String,required:true,lowercase:true,index:true},
 purpose:{type:String,enum:['register','reset'],required:true},
 codeHash:{type:String,required:true},
 username:{type:String},
 passwordHash:{type:String},
 attempts:{type:Number,default:0},
 expiresAt:{type:Date,required:true}
},{timestamps:true});
authOtpSchema.index({expiresAt:1},{expireAfterSeconds:0});
authOtpSchema.index({email:1,purpose:1},{unique:true});
module.exports=mongoose.model('AuthOtp',authOtpSchema);
