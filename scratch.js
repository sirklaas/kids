import fetch from 'node-fetch';
async function test() {
  const res = await fetch('https://pinkmilk.pockethost.io/api/collections/kids_plot_cards/records?perPage=1');
  const data = await res.json();
  console.log(JSON.stringify(data.items[0], null, 2));
}
test();
