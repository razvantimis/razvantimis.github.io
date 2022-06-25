const config = {
  provider: process.env.PROVIDER || "github",
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  redirectUrl: process.env.REDIRECT_URL!,

};
export default config;
