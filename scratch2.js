import fetch from 'node-fetch';

async function test() {
  const projectId = 'nyv647330inpx4j';
  
  // Test 1: Original filter
  let res = await fetch(`https://pinkmilk.pockethost.io/api/collections/kids_plot_cards/records?filter=project_id~"${projectId}"`);
  let data = await res.json();
  console.log('Original filter items:', data.items?.length);

  // Test 2: = filter (My broken fix)
  res = await fetch(`https://pinkmilk.pockethost.io/api/collections/kids_plot_cards/records?filter=project_id="${projectId}"`);
  data = await res.json();
  console.log('= filter items:', data.items?.length);
}
test();
