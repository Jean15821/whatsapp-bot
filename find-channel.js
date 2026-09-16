require('dotenv').config();

async function findChannel() {
  const orgRes = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BUFFER_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      query: `query { account { organizations { id name } } }`
    }),
  });
  const orgData = await orgRes.json();
  console.log('RAW:', JSON.stringify(orgData, null, 2));
  const orgId = orgData.data.account.organizations[0].id;
  console.log('organizationId:', orgId);

  const chRes = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BUFFER_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      query: `query { channels(input: { organizationId: "${orgId}" }) { id name service } }`
    }),
  });
  const chData = await chRes.json();
  console.log('Channels:', JSON.stringify(chData.data.channels, null, 2));
}

findChannel();
