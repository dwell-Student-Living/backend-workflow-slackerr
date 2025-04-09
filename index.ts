import {request } from 'https';
import type {RequestOptions} from 'https';
import {URL} from 'url';

export default async function sendSlackError(err: Error): Promise<void> {
  try {
    const {
      APP_NAME = 'Unblk Workflow Error Reporter',
      NODE_ENV = 'development',
      SLACK_CHANNEL = 'errors',
      SLACK_ENABLED = 'true',
    } = process.env;

    if (SLACK_ENABLED !== 'true') {
      return;
    }

    let color = 'good';
    switch (NODE_ENV) {
      case 'production':
        color = 'danger';
        break;
      case 'staging':
        color = 'warning';
        break;
    }

    const attachment = {
      fallback: err.message,
      title: 'Error details:',
      pretext: `NODE_ENV: ${NODE_ENV}`,
    //   title_link:'https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups',
      text: err.stack !== undefined ? err.stack : err.message,
      color,
    };

    const params = {
      text: `${APP_NAME}: ${err.message}`,
      icon_emoji: 'warning',
      channel: SLACK_CHANNEL,
      attachments: [attachment],
    };
    await makePostRequest(params);
  } catch (error) {
    console.error(error);
  }
}

function makePostRequest(data: unknown) {
  return new Promise((resolve, reject) => {
    const {SLACK_URL = 'CHANGE_ME', SLACK_TOKEN = 'abcd'} = process.env;
    if (SLACK_URL === 'CHANGE_ME' || SLACK_TOKEN === 'abcd') {
      throw new Error('Please configure SLACK_URL and SLACK_TOKEN env variables.');
    }

    const body = JSON.stringify(data);
    const {hostname, pathname} = new URL(SLACK_URL);
    const options: RequestOptions = {
      hostname,
      path: pathname,
      port: 443,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': body.length,
      },
    };
    const req = request(options, () => resolve(true));
    req.on('error', error => reject(error));
    req.on('timeout', () => reject('TIMEOUT'));
    req.write(body);
    req.end();
  });
}
