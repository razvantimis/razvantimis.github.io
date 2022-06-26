import {https} from "firebase-functions";
import express from "express";
import {AuthorizationCode} from "simple-oauth2";
import {
  randomState,
  renderResponse,
} from "@openlab/vercel-netlify-cms-github";

import config from "./config";

const client = new AuthorizationCode({
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
    state: randomState(),
  });

  res.redirect(authorizationUri);
});

oauthApp.get("/callback", async (req, res) => {
  const options: any = {
    code: req.query.code,
  };

  try {
    const accessToken = await client.getToken(options);
    const {token} = client.createToken(accessToken);
    return res.send(renderResponse("success", {
      token: token["token"].access_token,
      provider: "github",
    }));
  } catch (error: any) {
    console.error("Access Token Error", error.message);
    res.send(renderResponse("error", error));
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
