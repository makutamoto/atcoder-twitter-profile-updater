import { SQSHandler } from 'aws-lambda';
import chrome from 'chrome-aws-lambda';
const puppeteer = require('puppeteer-core');
const Jimp = require('jimp');
const Twitter = require('twitter-lite');

interface QueueMessage {
    twitterID: string,
    atcoderID: string,
    token: string,
    secret: string,
    banner: boolean,
    bio: boolean,
}

interface UserData {
    rating: number,
    color: string,
    kyu: string,
    graph: string,
}

const API_KEY = process.env.API_KEY as string;
const API_SECRET_KEY = process.env.API_SECRET_KEY as string;
if(API_KEY === undefined || API_SECRET_KEY === undefined) {
    throw "API_KEY or API_SECRET_KEY not specified.";
}

const RATING_COLORS = [
    '#D9D9D9', // GRAY
    '#D8C5B6', // BROWN
    '#B5D9B7', // GREEN
    '#B8ECED', // CYAN
    '#B3B2FF', // BLUE
    '#EBECBD', // YELLOW
    '#FCD9BC', // ORANGE
    '#FAB2BA', // RED
];

const RATING_COLOR_NAMES = [
    '灰', // GRAY
    '茶', // BROWN
    '緑', // GREEN
    '水', // CYAN
    '青', // BLUE
    '黄', // YELLOW
    '橙', // ORANGE
    '赤', // RED
];

const ATCODER_RATING_REGEX = /AtCoder(\s*[色灰茶緑水青黄橙赤])?(\s*(?:級|\d+\s*級|[初二三四五六七八九十]段|[皆極]伝))?(\s*\(\d*?\))?/g;

async function getUserData(username: string): Promise<UserData> {
    const browser = await puppeteer.launch({
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
    });
    const page = await browser.newPage();
    await page.goto(`https://atcoder.jp/users/${username}/?lang=ja&graph=rating`, {
        waitUntil: 'networkidle0',
    });
    await page.setViewport({
        width: 1000,
        height: 900,
    });
    const rating = (await
        page.evaluate(`Number(document.querySelector('#main-container div.row div:nth-of-type(3) table.dl-table tbody tr:nth-of-type(2) td span').innerText)`)
            .catch(() => 0)
    ) as number;
    const color = RATING_COLOR_NAMES[Math.min(7, Math.floor(rating / 400))];
    const kyu = (await
        page.evaluate(`document.querySelector('#main-container div.row div:nth-of-type(3) table.dl-table tbody tr:nth-of-type(3) td span.bold').innerText`)
            .catch(() => "")
    ) as string;
    const backgroundColor = RATING_COLORS[Math.min(7, Math.floor(rating / 400))];
    const backgraundImage = await Jimp.create(1500, 500, backgroundColor);
    const graphImage = await Jimp.read(await page.screenshot({
        clip: {
            x: 290,
            y: 370,
            width: 640,
            height: 445,
        },
    }));
    graphImage.resize(Jimp.AUTO, 500);
    backgraundImage.composite(
        graphImage,
        (backgraundImage.getWidth() - graphImage.getWidth()) / 2,
        0
    );
    const graph = (await backgraundImage.getBufferAsync(Jimp.MIME_PNG)).toString('base64');
    await browser.close();
    return { rating, color, kyu, graph };
}

async function setProfile(userID: string, token: string, secret: string, data: UserData, bio: boolean, banner: boolean) {
    const client = new Twitter({
        consumer_key: API_KEY,
        consumer_secret: API_SECRET_KEY,
        access_token_key: token,
        access_token_secret: secret,
    });
    if(bio) {
        const profile = await client.get('users/show', {
            user_id: userID,
            include_entities: false,
        });
        const description = profile.description.replace(ATCODER_RATING_REGEX, (_: string, color: string | null, kyu: string | null, rating: string | null) =>
            `AtCoder${color ? ` ${data.color}` : ""}${kyu ? ` ${data.kyu}` : ""}${rating ? ` (${data.rating})` : ""}`
        );
        await client.post('account/update_profile', {
            description,
        });
    }
    if(banner) {
        await client.post('account/update_profile_banner', {
            banner: data.graph,
        });
    }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const handler: SQSHandler = async (event) => {
    try {
        const message: QueueMessage = JSON.parse(event.Records[0].body);
        console.log("Sleeping...");
        await sleep(10000);
        console.log("Fetching user data...");
        const data = await getUserData(message.atcoderID);
        console.log("Setting user profile...");
        await setProfile(message.twitterID, message.token, message.secret, data, message.bio, message.banner);
    } catch(err) {
        console.error(err);
    }
};
