import bodyParser from 'body-parser';
export default bodyParser.json({ limit: '5mb', inflate: false });
