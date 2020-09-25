export interface Session {
    user: {
        name: string;
        id: string;
        refreshToken: string;
        accessToken: string;
    };
}
