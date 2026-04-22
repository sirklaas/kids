#!/usr/bin/env tsx
/**
 * Seed 10 default series with characters
 * These are reusable series that always exist
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pinkmilk.pockethost.io')

const DEFAULT_SERIES = [
  {
    name: 'Paddington Adventures',
    description: 'A heartwarming series about a bear called Paddington who is always looking for honey. His two best friends are Tiger and Igor.',
    image_url: '',
    characters: [
      { name: 'Paddington', visual_appearance: 'A fluffy brown bear with a red hat and blue coat, always carrying a suitcase', age_group: 'child', personality: 'Curious, polite, loves honey', catchphrases: 'Oh, bother!', voice_style: 'Warm British accent, gentle and kind' },
      { name: 'Tiger', visual_appearance: 'An orange striped cat with big green eyes, wearing a small bell collar', age_group: 'child', personality: 'Playful, mischievous, loyal', catchphrases: 'Let\'s pounce!', voice_style: 'Energetic, youthful voice' },
      { name: 'Igor', visual_appearance: 'A small hedgehog with spiky brown quills and a red scarf', age_group: 'child', personality: 'Shy, clever, brave when needed', catchphrases: 'I can help!', voice_style: 'Soft, quiet voice that squeaks when excited' },
    ]
  },
  {
    name: 'Jip & Janneke',
    description: 'Two inseparable friends who go on everyday adventures in their neighborhood.',
    image_url: '',
    characters: [
      { name: 'Jip', visual_appearance: 'A boy with blonde hair, wearing blue overalls and red sneakers', age_group: 'child', personality: 'Brave, protective, adventurous', catchphrases: 'Come on Janneke!', voice_style: 'Confident, clear voice of a 6-year-old boy' },
      { name: 'Janneke', visual_appearance: 'A girl with curly red hair, wearing a yellow dress and green boots', age_group: 'child', personality: 'Smart, creative, careful', catchphrases: 'Wait Jip, let\'s think!', voice_style: 'Bright, thoughtful voice' },
    ]
  },
  {
    name: 'Suske & Wiske',
    description: 'A classic duo solving mysteries with their aunt and uncle, traveling through time and space.',
    image_url: '',
    characters: [
      { name: 'Suske', visual_appearance: 'A boy with black hair wearing white shorts and a red shirt', age_group: 'child', personality: 'Brave, strong, sometimes impulsive', catchphrases: 'Let me handle this!', voice_style: 'Bold, confident boy voice' },
      { name: 'Wiske', visual_appearance: 'A girl with blonde pigtails, wearing a blue dress with white collar', age_group: 'child', personality: 'Smart, brave, clever with riddles', catchphrases: 'I have an idea!', voice_style: 'Intelligent, curious girl voice' },
      { name: 'Tante Sidonia', visual_appearance: 'An elderly lady with glasses, gray hair in a bun, wearing a long dress', age_group: 'elder', personality: 'Wise, caring, loves to cook', catchphrases: 'Oh my dears!', voice_style: 'Warm grandmotherly voice' },
      { name: 'Jerom', visual_appearance: 'A muscular strongman with blonde hair, wearing a striped tank top', age_group: 'adult', personality: 'Strong, gentle, loves eating', catchphrases: 'Jerom is hungry!', voice_style: 'Deep but friendly voice' },
    ]
  },
  {
    name: 'Dora the Explorer',
    description: 'A young girl who goes on adventures with her monkey friend, teaching Spanish along the way.',
    image_url: '',
    characters: [
      { name: 'Dora', visual_appearance: 'A young Latina girl with brown hair, wearing a pink shirt, orange shorts, and purple backpack', age_group: 'child', personality: 'Curious, helpful, bilingual', catchphrases: '¡Vámonos! Let\'s go!', voice_style: 'Cheerful, energetic girl voice' },
      { name: 'Boots', visual_appearance: 'A purple monkey with yellow belly, wearing red boots', age_group: 'child', personality: 'Playful, athletic, loves to dance', catchphrases: 'Ooh ooh, aah aah!', voice_style: 'High-pitched, playful monkey voice' },
    ]
  },
  {
    name: 'Peppa Pig',
    description: 'A cheeky little piggy who loves jumping in muddy puddles with her family and friends.',
    image_url: '',
    characters: [
      { name: 'Peppa', visual_appearance: 'A pink pig wearing a red dress and black shoes', age_group: 'toddler', personality: 'Playful, sometimes bossy, loves mud', catchphrases: 'Oink!', voice_style: 'High-pitched child voice with British accent' },
      { name: 'George', visual_appearance: 'A small pink pig wearing a blue shirt', age_group: 'toddler', personality: 'Shy, loves dinosaurs, looks up to Peppa', catchphrases: 'Dine-saw!', voice_style: 'Younger, softer voice' },
      { name: 'Mummy Pig', visual_appearance: 'An adult pink pig with eyelashes, wearing an orange dress', age_group: 'adult', personality: 'Caring, patient, loves cooking', catchphrases: 'Oh Peppa!', voice_style: 'Warm motherly voice' },
      { name: 'Daddy Pig', visual_appearance: 'A big pink pig with glasses and stubble, wearing green shirt', age_group: 'adult', personality: 'Funny, loves food, good at map reading', catchphrases: 'Ho ho ho!', voice_style: 'Deep, jolly fatherly voice' },
    ]
  },
  {
    name: 'Bluey',
    description: 'A lovable Blue Heeler puppy who lives with her family and goes on everyday adventures.',
    image_url: '',
    characters: [
      { name: 'Bluey', visual_appearance: 'A blue heeler puppy with light blue fur, darker blue ears and tail', age_group: 'child', personality: 'Energetic, creative, loves games', catchphrases: 'Hooray!', voice_style: 'Australian child voice, energetic' },
      { name: 'Bingo', visual_appearance: 'A smaller orange heeler puppy with cream spots', age_group: 'toddler', personality: 'Sweet, imaginative, follows Bluey', catchphrases: 'I want to play too!', voice_style: 'Younger Australian child voice' },
      { name: 'Bandit', visual_appearance: 'An adult blue heeler with blue fur, wearing glasses', age_group: 'adult', personality: 'Fun dad, loves playing with kids', catchphrases: 'Let\'s play!', voice_style: 'Friendly Australian dad voice' },
      { name: 'Chilli', visual_appearance: 'An adult red heeler with orange and cream fur', age_group: 'adult', personality: 'Caring mom, works at airport', catchphrases: 'Good job, kids!', voice_style: 'Warm Australian mom voice' },
    ]
  },
  {
    name: 'Octonauts',
    description: 'A team of underwater explorers who rescue sea creatures and protect the ocean.',
    image_url: '',
    characters: [
      { name: 'Captain Barnacles', visual_appearance: 'A polar bear in white uniform with captain hat, blue badge', age_group: 'adult', personality: 'Brave, responsible, natural leader', catchphrases: 'Octonauts, to the launch bay!', voice_style: 'Strong, commanding British accent' },
      { name: 'Kwazii', visual_appearance: 'An orange cat with pirate hat, eye patch, and striped shirt', age_group: 'adult', personality: 'Adventurous, brave, sometimes reckless', catchphrases: 'Yarrr!', voice_style: 'Pirate accent, enthusiastic' },
      { name: 'Peso', visual_appearance: 'A small penguin with medic hat and medical bag', age_group: 'child', personality: 'Gentle, caring, brave despite fears', catchphrases: 'I\'m here to help!', voice_style: 'Gentle, kind voice with slight Spanish accent' },
      { name: 'Tweak', visual_appearance: 'A green rabbit with engineer goggles and overalls', age_group: 'adult', personality: 'Inventive, loves building, says "right" often', catchphrases: 'Right, let me fix that!', voice_style: 'Australian accent, energetic' },
    ]
  },
  {
    name: 'PAW Patrol',
    description: 'A group of rescue dogs led by a tech-savvy boy, each with special skills and vehicles.',
    image_url: '',
    characters: [
      { name: 'Ryder', visual_appearance: 'A boy with spiky brown hair, wearing red and white jacket with pup pad', age_group: 'child', personality: 'Leader, tech-smart, brave', catchphrases: 'No job is too big, no pup is too small!', voice_style: 'Confident boy voice' },
      { name: 'Chase', visual_appearance: 'A German Shepherd police dog in blue uniform with police hat', age_group: 'child', personality: 'Serious, loyal, spy skills', catchphrases: 'Chase is on the case!', voice_style: 'Serious, police-style voice' },
      { name: 'Marshall', visual_appearance: 'A Dalmatian fire dog in red uniform with fire helmet', age_group: 'child', personality: 'Clumsy, brave, energetic', catchphrases: 'I\'m fired up!', voice_style: 'Energetic, enthusiastic voice' },
      { name: 'Skye', visual_appearance: 'A cockapoo in pink aviator outfit with goggles', age_group: 'child', personality: 'Fearless of heights, loves flying', catchphrases: 'This pup\'s gotta fly!', voice_style: 'High-pitched, cheerful girl voice' },
    ]
  },
  {
    name: 'Blippi',
    description: 'An energetic character who teaches kids about machines, animals, and the world through exploration.',
    image_url: '',
    characters: [
      { name: 'Blippi', visual_appearance: 'A man with orange and blue glasses, blue shirt, orange suspenders and bow tie', age_group: 'adult', personality: 'Energetic, curious, loves learning', catchphrases: 'Hey kids!', voice_style: 'Very energetic, high-pitched adult voice' },
      { name: 'Meekah', visual_appearance: 'A woman with purple glasses, blue shirt with purple accents', age_group: 'adult', personality: 'Creative, artistic, loves science', catchphrases: 'Let\'s create!', voice_style: 'Cheerful, warm voice' },
    ]
  },
  {
    name: 'Cocomelon',
    description: 'A family-friendly series with educational songs about everyday experiences.',
    image_url: '',
    characters: [
      { name: 'JJ', visual_appearance: 'A baby with one brown curl, wearing orange shirt with cocomelon logo', age_group: 'toddler', personality: 'Curious, happy, loves songs', catchphrases: 'La la la!', voice_style: 'Sweet baby voice' },
      { name: 'YoYo', visual_appearance: 'A girl with pigtails, wearing pink dress with yellow accents', age_group: 'child', personality: 'Caring sister, loves to share', catchphrases: 'Let\'s sing together!', voice_style: 'Sweet girl voice' },
      { name: 'TomTom', visual_appearance: 'A boy with brown hair, wearing blue shirt', age_group: 'child', personality: 'Playful brother, inventive', catchphrases: 'I have an idea!', voice_style: 'Energetic boy voice' },
      { name: 'Mommy', visual_appearance: 'A woman with brown hair in bun, wearing green dress', age_group: 'adult', personality: 'Nurturing, patient, sings beautifully', catchphrases: 'Time for a song!', voice_style: 'Warm singing voice' },
    ]
  },
]

async function seedSeries() {
  console.log('🌱 Seeding 10 default series...\n')

  for (const seriesData of DEFAULT_SERIES) {
    try {
      // Check if series already exists
      const existing = await pb.collection('kids_series').getFirstListItem(`name = "${seriesData.name}"`).catch(() => null)
      
      if (existing) {
        console.log(`✅ Series "${seriesData.name}" already exists`)
        continue
      }

      // Create series
      const series = await pb.collection('kids_series').create({
        name: seriesData.name,
        description: seriesData.description,
        image_url: seriesData.image_url,
      })

      console.log(`✅ Created series: ${series.name}`)

      // Create characters for this series
      for (const charData of seriesData.characters) {
        const character = await pb.collection('kids_characters').create({
          name: charData.name,
          visual_appearance: charData.visual_appearance,
          age_group: charData.age_group,
          personality: charData.personality,
          catchphrases: charData.catchphrases,
          voice_style: charData.voice_style,
          backstory: '',
        })

        // Link character to series
        await pb.collection('kids_series_characters').create({
          series_id: series.id,
          character_id: character.id,
          character_order: seriesData.characters.indexOf(charData) + 1,
          is_main_character: seriesData.characters.indexOf(charData) === 0,
        })

        console.log(`  👤 Added character: ${character.name}`)
      }

    } catch (err) {
      console.error(`❌ Failed to create "${seriesData.name}":`, err)
    }
  }

  console.log('\n🎉 Done! 10 series seeded successfully.')
}

seedSeries().catch(console.error)
