import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { InitOptions } from "next-auth";
import Providers from "next-auth/providers";

const options: InitOptions = {
    providers: [
        Providers.Twitter({
            clientId: process.env.TWITTER_ID,
            clientSecret: process.env.TWITTER_SECRET,
        }),
    ],
    callbacks: {
        session: async (session, user) => {
            return { ...session, user };
        },
        jwt: async (token, user, account) => {
            return { ...token, user, ...account };
        },
    },
};

export default (req: NextApiRequest, res: NextApiResponse) =>
    NextAuth(req, res, options);
