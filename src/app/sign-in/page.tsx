"use client";

import { signIn } from "@/lib/auth-client"; //import the auth client



export default function SignIn() {

    return (
        <>
            <p>Sign In</p>
            <button onClick={async ()=>await signIn.social({
                /**
                 * The social provider ID
                 * @example "github", "google", "apple"
                 */
                provider: "google",
                /**
                 * A URL to redirect after the user authenticates with the provider
                 * @default "/"
                 */
                callbackURL: "/dashboard",
                /**
                 * A URL to redirect if an error occurs during the sign in process
                 */
                errorCallbackURL: "/error",
                /**
                 * A URL to redirect if the user is newly registered
                 */
                newUserCallbackURL: "/welcome",
            })}>Sign In</button>
        </>
    );
}