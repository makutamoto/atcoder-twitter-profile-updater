import React from "react";
import { AppProps } from "next/app";
import Head from "next/head";
import { Provider } from "next-auth/client";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";

import "bootstrap/dist/css/bootstrap.min.css";

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
    return (
        <Provider session={pageProps.session}>
            <Head>
                <title>AtCoder Twitter Profile Updater</title>
            </Head>
            <Navbar bg="dark" variant="dark" sticky="top">
                <Navbar.Brand>AtCoder Twitter Profile Updater</Navbar.Brand>
                <Navbar.Toggle />
                <Navbar.Collapse>
                    <Nav>
                        <NavDropdown id="nav-dropdown-links" title="Links">
                            <NavDropdown.Item href="https://github.com/makutamoto/atcoder-twitter-profile-updater">
                                GitHub
                            </NavDropdown.Item>
                            <NavDropdown.Item href="https://twitter.com/makutamoto">
                                @makutamoto
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
            <Container className="p-4">
                <main>
                    <Component {...pageProps} />
                </main>
            </Container>
        </Provider>
    );
};

export default App;
