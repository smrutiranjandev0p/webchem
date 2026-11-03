<div align="center">

# ⚗️ WebChem

### **THE CHEMISTRY LAB — REIMAGINED**

*Explore the science. Master the concepts. Build your chemistry intuition.*

<p>
  <a href="https://smrutiranjandev0p.github.io/webchem/"><img src="https://img.shields.io/badge/🚀_LAUNCH_WEB-CHEM-00E5FF?style=for-the-badge&labelColor=07131D" alt="Launch WebChem"></a>
  <a href="https://github.com/smrutiranjandev0p/webchem"><img src="https://img.shields.io/badge/GITHUB-REPOSITORY-9B5CFF?style=for-the-badge&labelColor=07131D" alt="GitHub repository"></a>
</p>

<p>
  <img src="https://img.shields.io/badge/CHEMISTRY-LEARNING-00D9A6?style=flat-square">
  <img src="https://img.shields.io/badge/AI-ASSISTED-8B5CF6?style=flat-square">
  <img src="https://img.shields.io/badge/WEB-APP-00B8D9?style=flat-square">
  <img src="https://img.shields.io/badge/PWA-READY-FFB020?style=flat-square">
</p>

</div>

---

> [!NOTE]
> **WebChem is an evolving chemistry-learning platform.** Features and availability may change as the project develops.

## ◈ Welcome to the Lab

WebChem brings chemistry learning into one interactive digital space—from foundational concepts and calculations to quizzes, guided practice, and AI-assisted learning.

Whether you're revising for an exam, exploring chemistry concepts, or strengthening your laboratory knowledge, WebChem is designed to make learning more accessible and engaging.

<div align="center">

| 🧠 Learn | 🧪 Practice | ⚡ Explore |
|:---:|:---:|:---:|
| Chemistry concepts & learning resources | Quizzes, CBT-style practice & calculations | Interactive tools & virtual learning |

</div>

## ✦ Inside WebChem

| Area | What you can explore |
|---|---|
| **Chemistry Learning** | Chemistry topics, concepts, and study resources |
| **Calculators & Tools** | Useful chemistry calculations and learning utilities |
| **Quiz & CBT Practice** | Question practice, answer review, and exam-style learning |
| **AI Tutor** | AI-assisted chemistry questions and explanations (when configured and available) |
| **Virtual Learning** | Educational simulations and guided concept exploration |
| **Learner Progress** | Account-based progress and learning continuity (when signed in) |
| **Progressive Web App** | Installable app experience on supported browsers |

## 🚀 Open WebChem

**Start exploring:** [smrutiranjandev0p.github.io/webchem](https://smrutiranjandev0p.github.io/webchem/)

WebChem is hosted as a web application. Open the link in a modern browser; on supported devices, your browser may offer an option to install it.

## 🛠️ Technology

<div align="center">

| Frontend | Backend | Data & Services |
|:---:|:---:|:---:|
| HTML · CSS · JavaScript | Node.js · Express | MongoDB |
| Progressive Web App | REST API | Google OAuth (optional) |
| Responsive interface | AI integration (optional) | Email/OTP (configured server-side) |

</div>

## 🧑‍💻 Run locally

### Requirements

- Node.js **20 or newer**
- MongoDB connection (local or hosted)
- Git

### Setup

```bash
git clone https://github.com/smrutiranjandev0p/webchem.git
cd webchem
npm install
```

Create a local environment file from the example:

```bash
cp .env.example .env
```

Add your own development credentials to `.env`, then start the backend:

```bash
npm run dev
```

The API normally runs at `http://localhost:5000`. Serve the frontend through a local HTTP server rather than opening the HTML file directly. Configure `FRONTEND_URL` to match your local frontend origin.

> **Security:** Never commit your `.env` file, OAuth secrets, API keys, database connection strings, SMTP passwords, or JWT/OTP secrets.

## ⚙️ Environment configuration

The backend may use these environment variables depending on enabled features:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Runtime environment |
| `PORT` | Server port (Railway may provide this automatically) |
| `MONGODB_URI` | MongoDB connection |
| `JWT_SECRET` | Session token signing secret |
| `JWT_EXPIRE` | Token lifetime |
| `FRONTEND_URL` | Allowed frontend origin |
| `GOOGLE_CLIENT_ID` | Google Sign-In client ID |
| `OPENAI_API_KEY` | AI Tutor provider key |
| `OPENAI_MODEL` | AI model selection |
| `OTP_SECRET` | OTP hashing secret |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Email server settings |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Email sender credentials |

Set secrets only in local ignored environment files or your hosting provider’s secret-variable settings. **Do not put real secrets in README, source code, screenshots, or commits.**

## 📲 Progressive Web App

WebChem includes PWA support through:

- `manifest.webmanifest` — app metadata and install presentation
- `sw.js` — service-worker app-shell caching
- App icons under `icons/`

The service worker is intended to cache the app shell, not private account data. Some online features require an active connection.

## 🧭 Project structure

```text
webchem/
├── index.html                 # WebChem frontend
├── manifest.webmanifest       # PWA manifest
├── sw.js                     # Service worker
├── icons/                     # App icons
├── backend/
│   ├── server.js              # Express server
│   ├── routes/                # API routes
│   ├── models/                # MongoDB models
│   └── services/              # Backend services
├── tests/                     # Project tests (where present)
├── .env.example               # Environment variable template
└── package.json
```

## 🔐 Privacy & safety

- Keep credentials and secrets out of Git.
- Use separate databases and secrets for development and production.
- Never share OTPs, passwords, API keys, or session tokens.
- Treat AI responses and educational simulations as learning aids; verify important scientific or industrial decisions against authoritative sources.
- WebChem's urea/fertilizer simulator is **educational**, not a validated industrial process-control model.

## 🧪 Contributing

Ideas, bug reports, and improvements are welcome.

1. Fork the repository.
2. Create a focused branch.
3. Make and test your changes.
4. Open a pull request with a clear description and screenshots when relevant.

Please avoid committing secrets, generated credentials, or unrelated changes.

## 📜 License

See the repository's license file for the applicable terms.

---

<div align="center">

### **Curiosity looks good on you.**

*Keep exploring. Keep experimenting. Keep learning.*

[**Enter WebChem →**](https://smrutiranjandev0p.github.io/webchem/)

<sub>Built for curious minds, chemistry learners, and future scientists. ⚗️</sub>

</div>
