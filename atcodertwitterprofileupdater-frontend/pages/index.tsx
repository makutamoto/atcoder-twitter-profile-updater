import React, { useCallback, useState } from "react";
import { GetServerSideProps } from "next";
import { signIn, signOut, useSession, getSession } from "next-auth/client";
import { Alert, Button, Figure, Form, Spinner } from "react-bootstrap";
import gql from "graphql-tag";
import axios from "axios";

import { Session } from "../lib/session";
import { query } from "../lib/graphql";

enum Status {
    Normal,
    Updating,
    NoAtCoderID,
    CheckAtLeastOne,
    Success,
    Failed,
}

interface Props {
    atcoderID?: string;
    banner?: boolean;
    bio?: boolean;
}
export const Index: React.FC<Props> = (props) => {
    const [session, loading] = useSession();
    const [atcoderID, setAtCoderID] = useState(props.atcoderID ?? "");
    const [banner, setBanner] = useState(props.banner ?? false);
    const [bio, setBio] = useState(props.bio ?? false);
    const [autoUpdate, setAutoUpdate] = useState(!!props.atcoderID);
    const [status, setStatus] = useState(Status.Normal);
    const onClickUpdateButton = useCallback(() => {
        if (!atcoderID) {
            setStatus(Status.NoAtCoderID);
            return;
        }
        if (!banner && !bio) {
            setStatus(Status.CheckAtLeastOne);
            return;
        }
        setStatus(Status.Updating);
        axios
            .post("/api/update", {
                atcoderID,
                banner,
                bio,
                autoUpdate,
            })
            .then(() => {
                setStatus(Status.Success);
            })
            .catch((err) => {
                console.error(err);
                setStatus(Status.Failed);
            });
    }, [atcoderID, banner, bio, autoUpdate]);
    return (
        <>
            {status === Status.NoAtCoderID && (
                <Alert variant="danger">AtCoder IDを入力して下さい。</Alert>
            )}
            {status === Status.CheckAtLeastOne && (
                <Alert variant="danger">
                    少なくともバナー画像もしくはBioのどちらか一方にチェックをつけてください。
                </Alert>
            )}
            {status === Status.Success && (
                <Alert variant="success">
                    更新キューに入りました。しばらくすると更新されます。
                </Alert>
            )}
            {status === Status.Failed && (
                <Alert variant="danger">エラーが発生しました。</Alert>
            )}
            <Alert variant="primary">
                BioのAtCoder()という文字列にAtCoder(875)のようにレートを挿入したり、バナー画像をレート遷移グラフに設定したりできます。
            </Alert>
            <Alert variant="warning">
                バナー画像やBioは変更前に戻せません。もし戻す可能性がある場合は必ずバックアップを取った上で使用して下さい。
            </Alert>
            <div className="text-center">
                <Figure>
                    <Figure.Image src="/pictures/example.png" thumbnail />
                    <Figure.Caption>参考画像</Figure.Caption>
                </Figure>
            </div>
            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" />
                </div>
            ) : session === null ? (
                <div className="text-center">
                    <Button onClick={() => signIn("twitter")}>
                        Twitterでログイン
                    </Button>
                </div>
            ) : (
                <div>
                    <h2>{session.user.name}</h2>
                    <Button
                        className="my-2"
                        variant="danger"
                        onClick={() => signOut()}
                    >
                        ログアウト
                    </Button>
                    <Form.Group>
                        <Form.Label>AtCoder ID</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Makutamoto..."
                            value={atcoderID}
                            onChange={(event) =>
                                setAtCoderID(event.currentTarget.value)
                            }
                        />
                    </Form.Group>
                    <div>
                        <Form.Check
                            id="banner-switch"
                            inline
                            label="バナー画像を変更"
                            type="switch"
                            checked={banner}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => setBanner(e.currentTarget.checked)}
                        />
                        <Form.Check
                            id="bio-switch"
                            inline
                            label="Bioを変更"
                            type="switch"
                            checked={bio}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => setBio(e.currentTarget.checked)}
                        />
                        <Form.Check
                            id="auto-update-switch"
                            inline
                            label="毎週月曜日に自動更新"
                            type="switch"
                            checked={autoUpdate}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => setAutoUpdate(e.currentTarget.checked)}
                        />
                    </div>
                    <div className="text-right">
                        <Button
                            variant="primary"
                            disabled={status === Status.Updating}
                            onClick={onClickUpdateButton}
                        >
                            {status === Status.Updating && (
                                <Spinner
                                    className="mr-2"
                                    animation="border"
                                    size="sm"
                                />
                            )}
                            プロフィールを更新
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};
export default Index;

interface GetUserResponse {
    getUser: {
        atcoderID: string;
        banner: boolean;
        bio: boolean;
    };
}

const GETUSER_DOCUMENT = gql`
    query GetUser($twitterID: ID!) {
        getUser(twitterID: $twitterID) {
            atcoderID
            banner
            bio
        }
    }
`;
export const getServerSideProps: GetServerSideProps<Props> = async ({
    req,
}) => {
    const session: Session = (await getSession({ req })) as any;
    if (session === null) {
        return {
            props: {},
        };
    }
    const res = (await query(GETUSER_DOCUMENT, {
        twitterID: session.user.id,
    })) as GetUserResponse;
    // eslint-disable-next-line
    console.log(res);
    return {
        props: {
            ...res.getUser,
        },
    };
};
