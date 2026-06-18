// Native fetch in Node 24

async function checkFeed() {
  const url = process.env.CTN_FEED_URL || 'https://cartracker.com.ng/?ctn_leads=ctn-7Qk29Lf3Rb8xZ2';
  const res = await fetch(`${url}&format=json&since=36760`);
  const data = await res.json();
  console.log(JSON.stringify(data.leads.slice(0, 2), null, 2));
}
checkFeed();
