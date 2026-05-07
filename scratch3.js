import fetch from 'node-fetch';

async function test() {
  const projectId = 'nyv647330inpx4j';
  
  // Create a test card
  const createRes = await fetch('https://pinkmilk.pockethost.io/api/collections/kids_plot_cards/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      act: 'beginning',
      order: 99,
      scene_beat: 'Test beat',
      duration_sec: 15
    })
  });
  
  const created = await createRes.json();
  console.log('Created card:', created);
}
test();
