import {https} from "firebase-functions";
import express from "express";
import * as auth2 from "simple-oauth2";
import randomstring from "randomstring";
import config from "./config";

function getScript(mess: string, content: any) {
  return `<!doctype html><html><body><script>
  (function() {
    function receiveMessage(e) {
      console.log("receiveMessage %o", e)
      window.opener.postMessage(
        'authorization:github:${mess}:${JSON.stringify(content)}',
        e.origin
      )
      window.removeEventListener("message",receiveMessage,false);
    }
    window.addEventListener("message", receiveMessage, false)
    console.log("Sending message: %o", "github")
    window.opener.postMessage("authorizing:github", "*")
    })()
  </script></body></html>`;
}

const client = new auth2.AuthorizationCode({
  client: {
    id: config.clientId,
    secret: config.clientSecret,
  },
  auth: {
    tokenHost: "https://github.com",
    tokenPath: "/login/oauth/access_token",
    authorizePath: "/login/oauth/authorize",
  },
});


const oauthApp = express();

oauthApp.get("/auth", (req, res) => {
  const authorizationUri = client.authorizeURL({
    redirect_uri: config.redirectUrl,
    scope: "repo,user",
    state: randomstring.generate(32),
  });

  res.redirect(authorizationUri);
});

oauthApp.get("/callback", async (req, res) => {
  const options: any = {
    code: req.query.code,
  };

  try {
    const accesToken = await client.getToken(options);
    return res.send(getScript("success", {
      token: accesToken.token,
      provider: config.provider,
    }));
  } catch (error: any) {
    console.error("Access Token Error", error.message);
    res.send(getScript("error", error));
  }
  return;
});

oauthApp.get("/success", (req, res) => {
  res.send("");
});

oauthApp.get("/", (req, res) => {
  res.redirect(301, "/oauth/auth");
});

exports.oauthGithub = https.onRequest(oauthApp);
