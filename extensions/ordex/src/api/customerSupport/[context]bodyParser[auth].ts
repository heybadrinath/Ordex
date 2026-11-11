import bodyParser from 'body-parser';
export default bodyParser.json({ limit: '16kb', inflate: false });
