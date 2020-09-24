import { NextApiHandler } from 'next';
import { getSession } from 'next-auth/client';
import gql from 'graphql-tag';

import { Session } from '../../lib/session';
import { mutate } from '../../lib/graphql';

interface Args {
    atcoderID: string,
    banner: boolean,
    bio: boolean,
    autoUpdate: boolean,
}

interface UserInputType {
    twitterID: string,
    atcoderID: string,
    token: string,
    secret: string,
    bio: boolean,
    banner: boolean,
}
const UPDATEUSER_DOCUMENT = gql`
mutation UpdateUser($input: UserInput!) {
    updateUser(input: $input) {
        twitterID
    }
}
`;
const REGISTERUSER_DOCUMENT = gql`
mutation RegisterUser($input: UserInput!) {
    registerUser(input: $input) {
        twitterID
    }
}
`;
const UNREGISTERUSER_DOCUMENT = gql`
mutation UnregisterUser($twitterID: ID!) {
    unregisterUser(twitterID: $twitterID) {
        twitterID
    }
}
`;
const update: NextApiHandler = async (req, res) => {
    if(req.method !== "POST") {
        res.status(405);
        res.json({
            error: "Method not Allowed.",
        });
        return;
    }
    const session: Session = (await getSession({ req })) as any;
    if(session === null) {
        res.status(401);
        res.json({
            error: "Not Authorized.",
        });
        return;
    }
    const args = req.body as Args;
    const variables = {
        input: {
            twitterID: session.user.id,
            atcoderID: args.atcoderID,
            token: session.user.accessToken,
            secret: session.user.refreshToken,
            banner: args.banner,
            bio: args.bio,
        },
    } as { input: UserInputType };
    await mutate<{ input: UserInputType }>(UPDATEUSER_DOCUMENT, variables);
    if(args.autoUpdate) await mutate(REGISTERUSER_DOCUMENT, variables);
    else await mutate(UNREGISTERUSER_DOCUMENT, { twitterID: session.user.id });
    res.status(200);
    res.json({
        error: null,
    });
};
export default update;
