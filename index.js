const express = require("express");
const axios = require("axios");
require("dotenv").config(); // Only needed if using .env

const app = express();
const PORT = 3000;

const cors = require('cors');
app.use(cors());


// Load from .env or hardcoded values
const APP_ID = process.env.INSTAGRAM_APP_ID || "YOUR_APP_ID";
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "YOUR_APP_SECRET";
const REDIRECT_URI = process.env.REDIRECT_URI || "https://socialapp-ww5a.onrender.com/auth/instagram/callback";

// ➤ HOME PAGE
app.get("/", (req, res) => {
  res.send(`<h1>Instagram API Integration</h1><a href="/auth/instagram"><button>Login with Instagram</button></a>`);
});

// ➤ Step 1: Instagram Login Redirect
app.get("/auth/instagram", (req, res) => {
    const authURL = `https://api.instagram.com/oauth/authorize?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;

  res.redirect(authURL);
});

// ➤ Step 2: Handle Instagram OAuth Callback
app.get("/auth/instagram/callback", async (req, res) => {
  const code = req.query.code;
  try {
    const tokenResponse = await axios.post("https://api.instagram.com/oauth/access_token", null, {
      params: {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code,
      },
    });

    const { access_token } = tokenResponse.data;

    // ➤ Fetch Profile
    const profileRes = await axios.get(`https://graph.instagram.com/me`, {
      params: {
        fields: "id,username,account_type,media_count",
        access_token,
      },
    });

    // ➤ Fetch Media
    const mediaRes = await axios.get(`https://graph.instagram.com/me/media`, {
      params: {
        fields: "id,caption,media_type,media_url,permalink",
        access_token,
      },
    });

    // ➤ Show Result
    res.send(`
      <h1>Welcome ${profileRes.data.username}</h1>
      <p>Account Type: ${profileRes.data.account_type}</p>
      <p>Media Count: ${profileRes.data.media_count}</p>
      <h3>Your Media</h3>
      ${mediaRes.data.data
        .map(
          (media) => `
        <div style="margin-bottom:20px;">
          <a href="${media.permalink}" target="_blank">
            ${media.media_type === "IMAGE" || media.media_type === "CAROUSEL_ALBUM"
              ? `<img src="${media.media_url}" width="200"/>`
              : `<video src="${media.media_url}" width="200" controls></video>`}
          </a>
          <p>${media.caption || "No caption"}</p>
        </div>
      `
        )
        .join("")}
    `);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("❌ Error fetching data from Instagram. Check logs.");
  }
});

// ➤ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
