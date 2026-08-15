import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    // Lets the eve TUI and your Vercel deployments reach the deployed agent.
    vercelOidc(),
    // Open on localhost for `eve dev` and the REPL; ignored in production.
    localDev(),
    // Public access: anyone who can reach the deployment can run hunts.
    // Swap this for your app's auth provider (Auth.js, Clerk, ...) before
    // putting the dashboard somewhere discoverable.
    none(),
  ],
});
