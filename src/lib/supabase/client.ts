import { createBrowserClient } from "@supabase/ssr/dist/main/createBrowserClient";
import { ENVIRONMENT } from "./../../config/environment";

export const createClient = () =>
  createBrowserClient(ENVIRONMENT.supabaseUrl!, ENVIRONMENT.supabaseKey!);
