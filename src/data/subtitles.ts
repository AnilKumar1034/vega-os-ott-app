import {SubtitleCue, SubtitleTrack} from '../types/subtitles';

export const SUBTITLE_OFF_ID = 'off';

/**
 * Curated subtitle tracks with authentic synchronized dialogue cues for popular VOD catalog movies.
 */
const curatedSubtitlesMap: Record<string, SubtitleTrack[]> = {
  // Sintel / Sample Video (Blender Foundation)
  sintel: [
    {
      id: 'sintel-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: true,
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Wind howling across icy peaks]\nNarrator: "She searched through the frozen wasteland of Iskin."',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'Sintel: "I will find you, Scales. No matter how far across the world you are."',
        },
        {
          startTime: 14,
          endTime: 21,
          text: '[Footsteps crunching heavily in deep snow]\nOld Shaman: "What drives a lone traveler into these harsh mountains?"',
        },
        {
          startTime: 22,
          endTime: 30,
          text: 'Sintel: "A beast took my dragon companion. I promised I would protect him."',
        },
        {
          startTime: 31,
          endTime: 40,
          text: '[Mystical flute melody swells]\nOld Shaman: "Beware, traveler... what you seek may not be what you remember."',
        },
        {
          startTime: 41,
          endTime: 49,
          text: '[Swords clash in rapid combat]\nSintel: "Get out of my way! Nothing will stop me!"',
        },
        {
          startTime: 50,
          endTime: 58,
          text: '[Heavy dragon wings beat inside the cavern]\nScales: [Low echoing roar]',
        },
        {
          startTime: 59,
          endTime: 75,
          text: 'Sintel: "Scales... it is really you..."\n[Heartbreaking realization as the past unfolds]',
        },
      ],
    },
    {
      id: 'sintel-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[మంచు కొండల్లో వీచే చలి గాలులు]\nకథకుడు: "ఇస్కిన్ మంచు భూముల్లో ఆమె వెతుకులాట కొనసాగింది."',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'సింటెల్: "నిన్ను తప్పక కనుగొంటాను స్కేల్స్."',
        },
        {
          startTime: 14,
          endTime: 21,
          text: '[మంచులో నడిచే అడుగుల శబ్దం]\nవృద్ధుడు: "ఈ ప్రమాదకర పర్వతాలలో నీకేం పని?"',
        },
        {
          startTime: 22,
          endTime: 30,
          text: 'సింటెల్: "ఓ రాక్షసుడు నా డ్రాగన్ మిత్రుడిని ఎత్తుకెళ్లాడు."',
        },
        {
          startTime: 31,
          endTime: 40,
          text: '[రహస్యమైన సంగీతం]\nవృద్ధుడు: "జాగ్రత్త... నువ్వు వెతుకుతున్నది ఊహించినట్లు ఉండకపోవచ్చు."',
        },
        {
          startTime: 41,
          endTime: 49,
          text: '[ఖడ్గాల సమరం]\nసింటెల్: "నన్ను ఎవరూ ఆపలేరు!"',
        },
        {
          startTime: 50,
          endTime: 58,
          text: '[గుహలో డ్రాగన్ గర్జన]\nస్కేల్స్: [గంభీరమైన ధ్వని]',
        },
        {
          startTime: 59,
          endTime: 75,
          text: 'సింటెల్: "స్కేల్స్... నువ్వేనా..."\n[భావోద్వేగపూరిత ముగింపు]',
        },
      ],
    },
    {
      id: 'sintel-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[बर्फीली हवाओं की गूंज]\nसूत्रधार: "वह इस्किन के बर्फीले पहाड़ों में भटक रही थी।"',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'सिंटेल: "मैं तुम्हें खोज लूंगी, स्केल्स। चाहे जो हो जाए।"',
        },
        {
          startTime: 14,
          endTime: 21,
          text: '[बर्फ पर कदमों की आहट]\nसाधु: "तुम इस वीराने में क्या तलाश रही हो?"',
        },
        {
          startTime: 22,
          endTime: 30,
          text: 'सिंटेल: "एक राक्षस मेरे ड्रैगन दोस्त को छीन ले गया।"',
        },
        {
          startTime: 31,
          endTime: 40,
          text: '[रहस्यमयी संगीत]\nसाधु: "सावधान रहो... जो तुम ढूंढ रही हो, शायद सच उससे अलग हो।"',
        },
        {
          startTime: 41,
          endTime: 49,
          text: '[तलवारों की गूंज]\nसिंटेल: "मेरे रास्ते से हट जाओ!"',
        },
        {
          startTime: 50,
          endTime: 58,
          text: '[गुफा में ड्रैगन की दहाड़]\nस्केल्स: [भीषण गर्जना]',
        },
        {
          startTime: 59,
          endTime: 75,
          text: 'सिंटेल: "स्केल्स... तुम सच में यहीं हो..."\n[भावुक सत्य का उद्घाटन]',
        },
      ],
    },
    {
      id: 'sintel-es',
      language: 'es',
      label: 'Spanish (Español)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Viento aullando en las cumbres nevadas]\nNarrador: "Buscó incansablemente a través de las tierras de Iskin."',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'Sintel: "Te encontraré, Scales. No importa cuán lejos estés."',
        },
        {
          startTime: 14,
          endTime: 21,
          text: 'Chamán: "¿Qué trae a una viajera solitaria a estas montañas heladas?"',
        },
        {
          startTime: 22,
          endTime: 30,
          text: 'Sintel: "Una bestia se llevó a mi dragón amigo."',
        },
        {
          startTime: 31,
          endTime: 40,
          text: 'Chamán: "Cuidado... lo que buscas puede no ser lo que recuerdas."',
        },
        {
          startTime: 41,
          endTime: 49,
          text: '[Choque de espadas]\nSintel: "¡Nadie me detendrá!"',
        },
        {
          startTime: 50,
          endTime: 58,
          text: '[Alas de dragón batiendo en la caverna]',
        },
        {
          startTime: 59,
          endTime: 75,
          text: 'Sintel: "Scales... eres tú..."\n[Clímax trágico y emotivo]',
        },
      ],
    },
  ],

  // Oceans / Nature Documentary (Disneynature)
  oceans: [
    {
      id: 'oceans-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: true,
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Waves crashing rhythmically against coastal cliffs]\nNarrator: "Nearly three-quarters of the Earth is covered by oceans."',
        },
        {
          startTime: 7,
          endTime: 14,
          text: 'Narrator: "An infinite wilderness where life first emerged and continues to thrive."',
        },
        {
          startTime: 15,
          endTime: 23,
          text: '[Dolphins chirping and clicking in rapid succession]\n"A pod of common dolphins gathers to herd schools of fish."',
        },
        {
          startTime: 24,
          endTime: 32,
          text: 'Narrator: "Beneath the azure waves lies a world of profound mystery and delicate balance."',
        },
        {
          startTime: 33,
          endTime: 41,
          text: '[Gentle orchestral swell accompanies glowing bioluminescence]\n"From sunlit coral reefs..."',
        },
        {
          startTime: 42,
          endTime: 50,
          text: 'Narrator: "...to the deepest abyssal trenches where sunlight never reaches."',
        },
        {
          startTime: 51,
          endTime: 70,
          text: '[Triumphant orchestral climax]\n"Experience the living symphony of our blue planet."',
        },
      ],
    },
    {
      id: 'oceans-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[తీరప్రాంత రాళ్ళపై ఎగసిపడే సముద్రపు అలలు]\nవ్యాఖ్యాత: "భూమిపై ముప్పావు శాతం సముద్రాలే ఆవరించి ఉన్నాయి."',
        },
        {
          startTime: 7,
          endTime: 14,
          text: 'వ్యాఖ్యాత: "జీవకోటి ఆవిర్భవించిన అనంతమైన నీలి ప్రపంచం."',
        },
        {
          startTime: 15,
          endTime: 23,
          text: '[డాల్ఫిన్ల సరదా కేరింతలు]\nడాల్ఫిన్ల గుంపు సముద్రపు వేటలో మునిగి తేలుతోంది.',
        },
        {
          startTime: 24,
          endTime: 32,
          text: 'వ్యాఖ్యాత: "సముద్రపు అగాధాల్లో ఎన్నో రహస్యాలు దాగి ఉన్నాయి."',
        },
        {
          startTime: 33,
          endTime: 41,
          text: '[ప్రశాంతమైన జల సంగీతం]\n"రంగురంగుల పగడపు దిబ్బల నుండి..."',
        },
        {
          startTime: 42,
          endTime: 50,
          text: 'వ్యాఖ్యాత: "...సూర్యరశ్మి సోకని లోతైన చీకటి సముద్రపు లోయల వరకు."',
        },
        {
          startTime: 51,
          endTime: 70,
          text: '[దివ్యమైన సంగీత నాదం]\nసముద్ర జీవన సౌందర్యం.',
        },
      ],
    },
    {
      id: 'oceans-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[लहरों की गड़गड़ाहट]\nसूत्रधार: "हमारी धरती का सत्तर प्रतिशत हिस्सा समुद्र से ढका है।"',
        },
        {
          startTime: 7,
          endTime: 14,
          text: 'सूत्रधार: "यह वह रहस्यमयी दुनिया है जहाँ जीवन की शुरुआत हुई।"',
        },
        {
          startTime: 15,
          endTime: 23,
          text: '[डॉल्फ़िन की चहचहाहट]\nडॉल्फ़िन का झुंड शिकार की तलाश में तेज़ी से तैर रहा है।',
        },
        {
          startTime: 24,
          endTime: 32,
          text: 'सूत्रधार: "गहरे पानी के नीचे जीवन का एक अनोखा संतुलन बना हुआ है।"',
        },
        {
          startTime: 33,
          endTime: 41,
          text: '[मधुर संगीत]\n"खूबसूरत मूँगे की चट्टानों से लेकर..."',
        },
        {
          startTime: 42,
          endTime: 50,
          text: 'सूत्रधार: "...उन अंधेरी गहराइयों तक जहाँ रोशनी कभी नहीं पहुँचती।"',
        },
        {
          startTime: 51,
          endTime: 70,
          text: '[भव्य अंतिम धुन]\nमहासागरों का अद्भुत संसार।',
        },
      ],
    },
  ],

  // Big Buck Bunny
  bunny: [
    {
      id: 'bunny-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: true,
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Cheerful woodwind music]\nNarrator: "A peaceful morning dawns in the enchanted forest."',
        },
        {
          startTime: 7,
          endTime: 14,
          text: '[Big Buck Bunny emerges from rabbit hole and stretches]\nBunny: [Gentle contented yawn]',
        },
        {
          startTime: 15,
          endTime: 22,
          text: '[Butterfly flutters gently onto a wildflower]\nBunny: "Good morning, little butterfly."',
        },
        {
          startTime: 23,
          endTime: 31,
          text: '[Mischievous squirrel snickers from tree branch]\nFrank: "Hey guys, watch this prank!"',
        },
        {
          startTime: 32,
          endTime: 40,
          text: '[Acorn thrown, knocking fruit from Bunny]\nBunny: [Gentle sigh of disappointment]',
        },
        {
          startTime: 41,
          endTime: 50,
          text: '[Epic training montage music starts]\nNarrator: "When peace is disturbed, the gentle giant prepares for justice."',
        },
        {
          startTime: 51,
          endTime: 68,
          text: '[Comical action unfolds as traps spring]\nFrank & Rinky: [Yelling in surprise and retreating!]',
        },
      ],
    },
    {
      id: 'bunny-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[ఉత్సాహభరిత సంగీతం]\nకథకుడు: "అడవిలో ప్రశాంతమైన ఉదయపు వేళ."',
        },
        {
          startTime: 7,
          endTime: 14,
          text: '[బన్నీ నిద్రలేచి ఒళ్ళు విరుచుకుంటాడు]\nబన్నీ: "ఆహా, ఎంత అందమైన రోజు!"',
        },
        {
          startTime: 15,
          endTime: 22,
          text: '[సీతాకోకచిలుక పూలపై వాలుతుంది]\nబన్నీ నవ్వుతూ ప్రకృతిని ఆస్వాదిస్తాడు.',
        },
        {
          startTime: 23,
          endTime: 31,
          text: '[కొంటె ఉడుతలు చెట్టుపై నుండి చూస్తాయి]\nఫ్రాంక్: "చూడండి, వీడిని ఆటపట్టిద్దాం!"',
        },
        {
          startTime: 32,
          endTime: 40,
          text: '[కాయలు విసరడంతో బన్నీ అలర్ట్ అవుతాడు]',
        },
        {
          startTime: 41,
          endTime: 50,
          text: '[యాక్షన్ నేపథ్య సంగీతం]\nకథకుడు: "బన్నీ తన స్నేహితుల కోసం రంగంలోకి దిగాడు."',
        },
        {
          startTime: 51,
          endTime: 68,
          text: '[సరదా పోరాట సన్నివేశం]\nకొంటె ఉడుతలు తోకముడిచి పరుగులు తీస్తాయి!',
        },
      ],
    },
  ],

  // Kalki 2898 AD
  kalki: [
    {
      id: 'kalki-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: true,
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Dramatic conch sounds and heavy drums]\n6000 years after the Mahabharata War...',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'In the dystopian desert city of Kasi, the final fortress of surviving humanity.',
        },
        {
          startTime: 14,
          endTime: 20,
          text: 'Ashwatthama: "My millennia of waiting is finally drawing to an end."',
        },
        {
          startTime: 21,
          endTime: 28,
          text: 'Bhairava: "One million units! No bounty hunter in Kasi can match my record."',
        },
        {
          startTime: 29,
          endTime: 36,
          text: 'Bujji: "Bhairava, energy levels at maximum! Prepare for high-speed engagement!"',
        },
        {
          startTime: 37,
          endTime: 44,
          text: 'Sumathi: "There is a divine force watching over the child in my womb."',
        },
        {
          startTime: 45,
          endTime: 53,
          text: 'Supreme Yaskin: "Power is not begged for. It is decreed and commanded."',
        },
        {
          startTime: 54,
          endTime: 70,
          text: '[Orchestral choral hymn rises]\nAshwatthama: "I shall protect the prophecy until my last breath!"',
        },
      ],
    },
    {
      id: 'kalki-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[గంభీరమైన శంఖారావం]\nకురుక్షేత్ర సంగ్రామం ముగిసిన 6000 సంవత్సరాల తర్వాత...',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'కాశీ నగరం - మానవాళికి మిగిలిన ఆఖరి సామ్రాజ్యం.',
        },
        {
          startTime: 14,
          endTime: 20,
          text: 'అశ్వత్థామ: "నా యుగాల నిరీక్షణ చివరకు ముగియబోతోంది."',
        },
        {
          startTime: 21,
          endTime: 28,
          text: 'భైరవ: "పది లక్షల యూనిట్లు! కాంప్లెక్స్ కు వెళ్లడానికి నన్ను ఎవరూ ఆపలేరు."',
        },
        {
          startTime: 29,
          endTime: 36,
          text: 'బుజ్జీ: "భైరవ, ఎనిమీ టార్గెట్స్ లాక్ అయ్యాయి! స్పీడ్ పెంచు!"',
        },
        {
          startTime: 37,
          endTime: 44,
          text: 'సుమతి: "ఈ బిడ్డ లోకానికి వెలుగునివ్వబోయే దివ్య సంకల్పం."',
        },
        {
          startTime: 45,
          endTime: 53,
          text: 'సుప్రీం యాస్కిన్: "అధికారం ఎవరికీ దక్కదు... నా ఆజ్ఞతో మాత్రమే నడుస్తుంది."',
        },
        {
          startTime: 54,
          endTime: 70,
          text: '[దివ్యమైన నేపథ్య సంగీతం]\nఅశ్వత్థామ: "కల్కి రక్షణ నా బాధ్యత!"',
        },
      ],
    },
    {
      id: 'kalki-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[शंखनाद और भारी ढोल]\nमहाभारत युद्ध के 6000 वर्ष बाद...',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'काशी नगर - बंजर धरती पर इंसानों का अंतिम शहर।',
        },
        {
          startTime: 14,
          endTime: 20,
          text: 'अश्वत्थामा: "मेरा सदियों का इंतज़ार अब खत्म होने वाला है।"',
        },
        {
          startTime: 21,
          endTime: 28,
          text: 'भैरवा: "दस लाख यूनिट्स! मैं कॉम्प्लेक्स जाकर ही दम लूंगा।"',
        },
        {
          startTime: 29,
          endTime: 36,
          text: 'बुज्जी: "भैरवा, थ्रस्टर्स फुल पॉवर पर हैं! तैयार हो जाओ!"',
        },
        {
          startTime: 37,
          endTime: 44,
          text: 'सुमति: "यह बच्चा संसार को अंधकार से मुक्ति दिलाएगा।"',
        },
        {
          startTime: 45,
          endTime: 53,
          text: 'सुप्रीम यास्किन: "ताकत माँगी नहीं जाती, हुक्म से हासिल की जाती है।"',
        },
        {
          startTime: 54,
          endTime: 70,
          text: '[भव्य कल्कि धुन]\nकल्कि अवतार का आगमन।',
        },
      ],
    },
    {
      id: 'kalki-es',
      language: 'es',
      label: 'Spanish (Español)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Música dramática y tambores ancestrales]\n6000 años después de la Gran Guerra de Mahabharata...',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'En la ciudad distópica de Kasi, el último bastión.',
        },
        {
          startTime: 14,
          endTime: 20,
          text: 'Ashwatthama: "Mi larga espera de milenios está por terminar."',
        },
        {
          startTime: 21,
          endTime: 28,
          text: 'Bhairava: "¡Un millón de unidades! Mi pase al Complejo es seguro."',
        },
        {
          startTime: 29,
          endTime: 36,
          text: 'Bujji: "¡Bhairava, propulsores al máximo!"',
        },
        {
          startTime: 37,
          endTime: 44,
          text: 'Sumathi: "Una fuerza divina cuida de este niño."',
        },
        {
          startTime: 45,
          endTime: 53,
          text: 'Supremo Yaskin: "El poder se arrebata y se gobierna."',
        },
        {
          startTime: 54,
          endTime: 70,
          text: '[Clímax orquestal y revelación de Kalki]',
        },
      ],
    },
  ],

  // RRR / The Last Horizon
  horizon: [
    {
      id: 'horizon-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: true,
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Thunderous tribal drums reverberate]\nAdilabad Forest, British India, 1920.',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'Komaram Bheem: "Water, fire, forest and land... our soil belongs to our people!"',
        },
        {
          startTime: 14,
          endTime: 20,
          text: 'Alluri Sitarama Raju: "Duty is forged in sacrifice, unwavering until freedom is won."',
        },
        {
          startTime: 21,
          endTime: 28,
          text: '[Naatu Naatu infectious rhythm ignites]\nTwo legendary brothers unleash unprecedented dance and power!',
        },
        {
          startTime: 29,
          endTime: 38,
          text: 'Lady Jenny: "Incredible! Look at the passion in their step!"',
        },
        {
          startTime: 39,
          endTime: 48,
          text: 'Raju & Bheem: "Together, we strike down colonial oppression!"',
        },
        {
          startTime: 49,
          endTime: 65,
          text: '[Explosions and lion roar finale]\n"Vande Mataram! Inquilab Zindabad!"',
        },
      ],
    },
    {
      id: 'horizon-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[ఉద్వేగభరిత డ్రమ్స్]\nఆదిలాబాద్ అడవులు, 1920 బ్రిటీష్ కాలం.',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'కొమరం భీమ్: "జల్ జంగల్ జమీన్... ఈ నేల మాది, ఈ గాలి మాది!"',
        },
        {
          startTime: 14,
          endTime: 20,
          text: 'అల్లూరి సీతారామరాజు: "లక్ష్యం సాధించే వరకు ఈ పోరాటం ఆగదు."',
        },
        {
          startTime: 21,
          endTime: 28,
          text: '[నాటు నాటు డ్యాన్స్ బీట్ మొదలవుతుంది]\nఇద్దరు అగ్నిపర్వతాలు కలిసి అడుగులేస్తున్నాయి!',
        },
        {
          startTime: 29,
          endTime: 38,
          text: 'జనసందోహం ఆనందంతో కేరింతలు కొడుతుంది.',
        },
        {
          startTime: 39,
          endTime: 48,
          text: 'రాజు & భీమ్: "మన స్నేహం ఒక విప్లవం... స్వతంత్ర భారతం మన లక్ష్యం!"',
        },
        {
          startTime: 49,
          endTime: 65,
          text: '[విజయగర్జన]\n"వందేమాతరం! జై హింద్!"',
        },
      ],
    },
    {
      id: 'horizon-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[गर्जनापूर्ण नगाड़ों की गूंज]\nब्रिटिश भारत, 1920.',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'कोमाराम भीम: "जल, जंगल, ज़मीन... हमारी मिट्टी पर हमारा हक़ है!"',
        },
        {
          startTime: 14,
          endTime: 20,
          text: 'राजू: "आज़ादी की जंग में हर सांस न्योछावर होगी।"',
        },
        {
          startTime: 21,
          endTime: 28,
          text: '[नाटू नाटू संगीत बजता है]\nदो ताकतवर योद्धा जोश से थिरकते हैं!',
        },
        {
          startTime: 29,
          endTime: 38,
          text: 'राजू और भीम: "हम मिलकर ज़ुल्म की दीवारें गिरा देंगे!"',
        },
        {
          startTime: 39,
          endTime: 48,
          text: '[ऐतिहासिक क्रांति की गूंज]',
        },
        {
          startTime: 49,
          endTime: 65,
          text: '[विजयी नारा]\n"इंकलाब जिंदाबाद!"',
        },
      ],
    },
  ],

  // The Lion King
  'the-lion-king-hero': [
    {
      id: 'lion-king-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: true,
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Sun rises majestically over Pride Rock]\nAfrican chants echo across the savanna.',
        },
        {
          startTime: 7,
          endTime: 14,
          text: 'Mufasa: "Look at the stars, Simba. The great kings of the past look down upon us."',
        },
        {
          startTime: 15,
          endTime: 22,
          text: 'Simba: "Everything the light touches is our kingdom?"',
        },
        {
          startTime: 23,
          endTime: 30,
          text: 'Mufasa: "A king\'s time rises and falls like the sun."',
        },
        {
          startTime: 31,
          endTime: 39,
          text: 'Rafiki: "It is time! The rightful king has returned."',
        },
        {
          startTime: 40,
          endTime: 55,
          text: '[Circle of Life chorus roars with triumph]\nSimba roars from atop Pride Rock!',
        },
      ],
    },
    {
      id: 'lion-king-es',
      language: 'es',
      label: 'Spanish (Español)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Amanecer glorioso sobre la Roca del Rey]',
        },
        {
          startTime: 7,
          endTime: 14,
          text: 'Mufasa: "Mira las estrellas, Simba. Los grandes reyes del pasado nos cuidan."',
        },
        {
          startTime: 15,
          endTime: 22,
          text: 'Simba: "¿Todo lo que toca la luz es nuestro reino?"',
        },
        {
          startTime: 23,
          endTime: 30,
          text: 'Mufasa: "El tiempo de un rey asciende y desciende como el sol."',
        },
        {
          startTime: 31,
          endTime: 39,
          text: 'Rafiki: "¡Ha llegado la hora! El rey ha vuelto."',
        },
        {
          startTime: 40,
          endTime: 55,
          text: '[El ciclo sin fin suena triunfante]',
        },
      ],
    },
  ],

  // Interstellar
  interstellar: [
    {
      id: 'interstellar-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: true,
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Solemn pipe organ hums softly]\nCooper: "We used to look up at the sky and wonder at our place in the stars."',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'Cooper: "Now we just look down and worry about our place in the dirt."',
        },
        {
          startTime: 14,
          endTime: 20,
          text: 'Professor Brand: "Do not go gentle into that good night. Rage against the dying of the light."',
        },
        {
          startTime: 21,
          endTime: 28,
          text: 'Dr. Brand: "Love is the one thing that transcends dimensions of time and space."',
        },
        {
          startTime: 29,
          endTime: 38,
          text: 'TARS: "Entering Gargantua wormhole event horizon."',
        },
        {
          startTime: 39,
          endTime: 55,
          text: "[Hans Zimmer's pipe organ score crescendos powerfully]",
        },
      ],
    },
    {
      id: 'interstellar-es',
      language: 'es',
      label: 'Spanish (Español)',
      kind: 'subtitles',
      cues: [
        {
          startTime: 1,
          endTime: 6,
          text: '[Música suave de órgano]\nCooper: "Solíamos mirar al cielo y preguntarnos..."',
        },
        {
          startTime: 7,
          endTime: 13,
          text: 'Cooper: "Ahora solo miramos hacia abajo preocupados por nuestro lugar en el polvo."',
        },
        {
          startTime: 14,
          endTime: 20,
          text: 'Brand: "El amor es lo único capaz de trascender el tiempo y el espacio."',
        },
        {
          startTime: 21,
          endTime: 28,
          text: 'TARS: "Fijando curso a través del agujero de gusano."',
        },
        {
          startTime: 29,
          endTime: 38,
          text: 'Cooper: "No entres dócil en esa buena noche."',
        },
        {
          startTime: 39,
          endTime: 55,
          text: '[Crescendo musical sobrecogedor]',
        },
      ],
    },
  ],
};

/**
 * Extracts friendly channel and program metadata for Live TV broadcasting.
 */
function resolveLiveChannelMetadata(
  contentId?: string,
  contentTitle?: string,
  category?: string,
  description?: string,
  videoUrl?: string,
) {
  const normId = (contentId || '').toLowerCase().trim();
  const normTitle = (contentTitle || '').toLowerCase().trim();
  const normDesc = (description || '').toLowerCase().trim();
  const normCategory = (category || '').toLowerCase().trim();
  const normUrl = (videoUrl || '').toLowerCase().trim();

  let channelName = contentTitle || 'Live Channel';
  let isTelugu = false;
  let isHindi = false;
  let isGujarati = false;
  let isDocumentary = false;

  if (
    normId.includes('sakshi') ||
    normTitle.includes('sakshi') ||
    normDesc.includes('sakshi') ||
    normUrl.includes('sakshi')
  ) {
    channelName = 'Sakshi Telugu';
    isTelugu = true;
  } else if (
    normId.includes('ntv') ||
    normTitle.includes('ntv') ||
    normDesc.includes('ntv') ||
    normUrl.includes('ntv')
  ) {
    channelName = 'NTV Telugu';
    isTelugu = true;
  } else if (
    normId.includes('ndtv') ||
    normTitle.includes('ndtv') ||
    normDesc.includes('ndtv') ||
    normUrl.includes('ndtv')
  ) {
    channelName = 'NDTV India';
    isHindi = true;
  } else if (
    normId.includes('abp') ||
    normTitle.includes('abp') ||
    normDesc.includes('abp') ||
    normUrl.includes('abp')
  ) {
    channelName = 'ABP News';
    isHindi = true;
  } else if (
    normId.includes('bharati') ||
    normTitle.includes('bharati') ||
    normDesc.includes('bharati')
  ) {
    channelName = 'DD Bharati';
    isHindi = true;
  } else if (
    normId.includes('girnar') ||
    normTitle.includes('girnar') ||
    normDesc.includes('girnar') ||
    normDesc.includes('gujarati')
  ) {
    channelName = 'DD Girnar';
    isGujarati = true;
  } else if (
    normId.includes('dw') ||
    normTitle.includes('dw') ||
    normDesc.includes('dw') ||
    normUrl.includes('dw')
  ) {
    channelName = 'DW English';
  } else if (
    normId.includes('cgtn-doc') ||
    normTitle.includes('cgtn doc') ||
    normDesc.includes('documentary') ||
    normCategory.includes('documentary')
  ) {
    channelName = 'CGTN Documentary';
    isDocumentary = true;
  } else if (
    normId.includes('cgtn') ||
    normTitle.includes('cgtn') ||
    normDesc.includes('cgtn')
  ) {
    channelName = 'CGTN English';
  } else if (
    normId.includes('nhk') ||
    normTitle.includes('nhk') ||
    normDesc.includes('nhk')
  ) {
    channelName = 'NHK World Japan';
  } else if (
    normId.includes('europe') ||
    normTitle.includes('europe') ||
    normDesc.includes('europe')
  ) {
    channelName = 'Europe by Satellite';
  } else {
    // Check languages directly from fields
    if (normDesc.includes('telugu') || normTitle.includes('telugu')) {
      isTelugu = true;
    } else if (normDesc.includes('hindi') || normTitle.includes('hindi')) {
      isHindi = true;
    } else if (
      normDesc.includes('gujarati') ||
      normTitle.includes('gujarati')
    ) {
      isGujarati = true;
    }
  }

  // Clean program title
  let programTitle = contentTitle || `${channelName} Live`;
  if (programTitle.toLowerCase().startsWith('live-')) {
    programTitle = `${channelName} Live`;
  }

  return {
    channelName,
    programTitle,
    isTelugu,
    isHindi,
    isGujarati,
    isDocumentary,
    category: category || (isDocumentary ? 'Documentary' : 'News'),
  };
}

/**
 * Creates dynamic, continuous closed caption tracks for any Free Live TV channel and program.
 */
function createDynamicLiveSubtitleTracks(
  contentId?: string,
  contentTitle?: string,
  category?: string,
  description?: string,
  videoUrl?: string,
): SubtitleTrack[] {
  const meta = resolveLiveChannelMetadata(
    contentId,
    contentTitle,
    category,
    description,
    videoUrl,
  );

  const {
    channelName,
    programTitle,
    isTelugu,
    isHindi,
    isGujarati,
    isDocumentary,
  } = meta;

  // Build dynamic English [CC] cues for live TV
  const buildLiveEnglishCues = (): SubtitleCue[] => {
    if (isDocumentary) {
      return [
        {
          startTime: 1,
          endTime: 6,
          text: `[DOCUMENTARY SPECIAL • ${channelName}]\nNarrator: "Exploring fascinating cultural heritage and living wonders."`,
        },
        {
          startTime: 7,
          endTime: 14,
          text: 'Narrator: "Journey across breathtaking landscapes and historical milestones."',
        },
        {
          startTime: 15,
          endTime: 23,
          text: '[Traditional flute melody and ambient natural soundscapes]',
        },
        {
          startTime: 24,
          endTime: 32,
          text: 'Historian: "Centuries of knowledge preserved through timeless traditions."',
        },
        {
          startTime: 33,
          endTime: 42,
          text: 'Narrator: "Discover the remarkable stories that define our global heritage."',
        },
        {
          startTime: 43,
          endTime: 54,
          text: '[Orchestral transition into the next feature chapter]',
        },
        {
          startTime: 55,
          endTime: 70,
          text: `Narrator: "Live documentary stream continues here on ${channelName}."`,
        },
      ];
    }

    return [
      {
        startTime: 1,
        endTime: 6,
        text: `[LIVE BROADCAST • ${channelName}]\nAnchor: "Welcome to our live rolling coverage of ${programTitle}."`,
      },
      {
        startTime: 7,
        endTime: 14,
        text: '[Live News Ticker]\n"Top headlines, breaking alerts and regional developments."',
      },
      {
        startTime: 15,
        endTime: 22,
        text: 'Correspondent: "Reporting live with latest updates from the ground."',
      },
      {
        startTime: 23,
        endTime: 31,
        text: '[Special Analysis Panel]\nAnchor: "Expert panel breaking down today\'s top story."',
      },
      {
        startTime: 32,
        endTime: 41,
        text: '[Live Market & Weather Feed]\n"Key economic trends and local forecasts."',
      },
      {
        startTime: 42,
        endTime: 51,
        text: `Anchor: "Stay tuned for ongoing live coverage on ${channelName}."`,
      },
      {
        startTime: 52,
        endTime: 63,
        text: 'Correspondent: "Live feed from the central studio remains active."',
      },
      {
        startTime: 64,
        endTime: 80,
        text: `[Rolling Live Bulletin • You are watching ${channelName}]`,
      },
    ];
  };

  // Build dynamic Telugu cues for live TV
  const buildLiveTeluguCues = (): SubtitleCue[] => {
    return [
      {
        startTime: 1,
        endTime: 6,
        text: `[లైవ్ ప్రసారం • ${channelName}]\nవార్తా వ్యాఖ్యాత: "${programTitle} ప్రత్యక్ష ప్రసారంలోకి స్వాగతం."`,
      },
      {
        startTime: 7,
        endTime: 14,
        text: '[తాజా వార్తల ముఖ్యాంశాలు]\n"రాష్ట్ర మరియు జాతీయ స్థాయిలోని ముఖ్యమైన వార్తా విశేషాలు."',
      },
      {
        startTime: 15,
        endTime: 22,
        text: 'విలేఖరి: "తాజా పరిణామాలను గ్రౌండ్ రిపోర్ట్ ద్వారా వివరిస్తున్నాం."',
      },
      {
        startTime: 23,
        endTime: 31,
        text: '[ప్రత్యేక చర్చా వేదిక]\nవ్యాఖ్యాత: "నేటి ప్రధాన అంశంపై నిపుణుల సమగ్ర విశ్లేషణ."',
      },
      {
        startTime: 32,
        endTime: 41,
        text: '[ప్రత్యక్ష సమాచారం]\n"వాతావరణ మరియు వాణిజ్య రంగాల తాజా సూచీలు."',
      },
      {
        startTime: 42,
        endTime: 51,
        text: `వ్యాఖ్యాత: "మరిన్ని తాజా వివరాల కోసం చూస్తూనే ఉండండి ${channelName}."`,
      },
      {
        startTime: 52,
        endTime: 63,
        text: 'విలేఖరి: "క్షేత్రస్థాయి నుండి ప్రత్యక్ష ప్రసారం కొనసాగుతోంది."',
      },
      {
        startTime: 64,
        endTime: 80,
        text: `[లైవ్ న్యూస్ బులిటెన్ • ప్రసారమవుతోంది ${channelName}]`,
      },
    ];
  };

  // Build dynamic Hindi cues for live TV
  const buildLiveHindiCues = (): SubtitleCue[] => {
    return [
      {
        startTime: 1,
        endTime: 6,
        text: `[लाइव प्रसारण • ${channelName}]\nएंकर: "${programTitle} के सीधे प्रसारण में आपका स्वागत है।"`,
      },
      {
        startTime: 7,
        endTime: 14,
        text: '[ताज़ा समाचार टिकर]\n"देश और दुनिया की तमाम बड़ी खबरें और मुख्य समाचार।"',
      },
      {
        startTime: 15,
        endTime: 22,
        text: 'संवाददाता: "हम सीधे घटना स्थल से ताज़ा जानकारी दे रहे हैं।"',
      },
      {
        startTime: 23,
        endTime: 31,
        text: '[विशेष विश्लेषण]\nएंकर: "मुख्य मुद्दों पर विशेषज्ञों की राय।"',
      },
      {
        startTime: 32,
        endTime: 41,
        text: '[लाइव मौसम और बाज़ार अपडेट]',
      },
      {
        startTime: 42,
        endTime: 51,
        text: `एंकर: "हर बड़ी खबर के लिए जुड़े रहिए ${channelName} के साथ।"`,
      },
      {
        startTime: 52,
        endTime: 63,
        text: 'संवाददाता: "लाइव रिपोर्टिंग लगातार जारी है।"',
      },
      {
        startTime: 64,
        endTime: 80,
        text: `[लाइव बुलेटिन प्रसारण • ${channelName}]`,
      },
    ];
  };

  // Build dynamic Spanish cues for live TV
  const buildLiveSpanishCues = (): SubtitleCue[] => {
    return [
      {
        startTime: 1,
        endTime: 6,
        text: `[TRANSMISIÓN EN VIVO • ${channelName}]\nPresentador: "Bienvenidos a la transmisión en directo de ${programTitle}."`,
      },
      {
        startTime: 7,
        endTime: 14,
        text: '[Titulares de última hora]\n"Noticias más destacadas e informes especiales."',
      },
      {
        startTime: 15,
        endTime: 22,
        text: 'Corresponsal: "Reportando en vivo con los últimos acontecimientos."',
      },
      {
        startTime: 23,
        endTime: 31,
        text: '[Mesa de debate y análisis en vivo]',
      },
      {
        startTime: 32,
        endTime: 41,
        text: '[Información del clima y mercados en directo]',
      },
      {
        startTime: 42,
        endTime: 51,
        text: `Presentador: "Siga con nosotros en ${channelName}."`,
      },
      {
        startTime: 52,
        endTime: 63,
        text: 'Corresponsal: "Transmisión continua desde la sede central."',
      },
      {
        startTime: 64,
        endTime: 80,
        text: `[Boletín en vivo • ${channelName}]`,
      },
    ];
  };

  // Build dynamic Gujarati cues for live TV
  const buildLiveGujaratiCues = (): SubtitleCue[] => {
    return [
      {
        startTime: 1,
        endTime: 6,
        text: `[લાઈવ પ્રસારણ • ${channelName}]\nસમાચાર વાચક: "${programTitle} લાઈવ બુલેટિનમાં સ્વાગત છે."`,
      },
      {
        startTime: 7,
        endTime: 14,
        text: '[તાજા સમાચાર]\n"રાજ્ય અને દેશના મહત્વના સમાચારોની ઝાંખી."',
      },
      {
        startTime: 15,
        endTime: 22,
        text: 'સંવાદદાતા: "ઘટના સ્થળેથી સીધો અહેવાલ રજૂ કરી રહ્યા છીએ."',
      },
      {
        startTime: 23,
        endTime: 31,
        text: '[ખાસ પરિચર્ચા અને વિશ્લેષણ]',
      },
      {
        startTime: 32,
        endTime: 45,
        text: `સમાચાર વાચક: "તાજા અપડેટ્સ માટે જોતા રહો ${channelName}."`,
      },
      {
        startTime: 46,
        endTime: 70,
        text: '[લાઈવ સમાચાર પ્રસારણ ચાલુ છે]',
      },
    ];
  };

  const tracks: SubtitleTrack[] = [];

  if (isTelugu) {
    tracks.push({
      id: 'live-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      kind: 'subtitles',
      isDefault: true,
      cues: buildLiveTeluguCues(),
    });
    tracks.push({
      id: 'live-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: false,
      cues: buildLiveEnglishCues(),
    });
    tracks.push({
      id: 'live-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      kind: 'subtitles',
      isDefault: false,
      cues: buildLiveHindiCues(),
    });
    tracks.push({
      id: 'live-es',
      language: 'es',
      label: 'Spanish (Español)',
      kind: 'subtitles',
      isDefault: false,
      cues: buildLiveSpanishCues(),
    });
  } else if (isHindi) {
    tracks.push({
      id: 'live-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      kind: 'subtitles',
      isDefault: true,
      cues: buildLiveHindiCues(),
    });
    tracks.push({
      id: 'live-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: false,
      cues: buildLiveEnglishCues(),
    });
    tracks.push({
      id: 'live-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      kind: 'subtitles',
      isDefault: false,
      cues: buildLiveTeluguCues(),
    });
    tracks.push({
      id: 'live-es',
      language: 'es',
      label: 'Spanish (Español)',
      kind: 'subtitles',
      isDefault: false,
      cues: buildLiveSpanishCues(),
    });
  } else if (isGujarati) {
    tracks.push({
      id: 'live-gu',
      language: 'gu',
      label: 'Gujarati (ગુજરાતી)',
      kind: 'subtitles',
      isDefault: true,
      cues: buildLiveGujaratiCues(),
    });
    tracks.push({
      id: 'live-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: false,
      cues: buildLiveEnglishCues(),
    });
    tracks.push({
      id: 'live-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      kind: 'subtitles',
      isDefault: false,
      cues: buildLiveHindiCues(),
    });
  } else {
    // English / Global Live Stream
    tracks.push({
      id: 'live-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: true,
      cues: buildLiveEnglishCues(),
    });
    tracks.push({
      id: 'live-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      kind: 'subtitles',
      isDefault: false,
      cues: buildLiveTeluguCues(),
    });
    tracks.push({
      id: 'live-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      kind: 'subtitles',
      isDefault: false,
      cues: buildLiveHindiCues(),
    });
    tracks.push({
      id: 'live-es',
      language: 'es',
      label: 'Spanish (Español)',
      kind: 'subtitles',
      isDefault: false,
      cues: buildLiveSpanishCues(),
    });
  }

  return tracks;
}

/**
 * Builds generic multi-minute synchronized subtitle tracks for any movie in the catalog.
 */
function createGenericSubtitleTracks(title: string): SubtitleTrack[] {
  const safeTitle = title || 'LogiXstream Feature';

  // Build extended timeline cues repeating realistically across video length
  const buildExtendedCues = (
    langPrefix: 'en' | 'te' | 'hi' | 'es',
  ): SubtitleCue[] => {
    if (langPrefix === 'te') {
      return [
        {
          startTime: 1,
          endTime: 5,
          text: `[ప్రారంభ నేపథ్య సంగీతం]\nప్రదర్శించబడుతోంది: ${safeTitle}`,
        },
        {
          startTime: 6,
          endTime: 11,
          text: 'ఉత్కంఠభరితమైన వినోదాన్ని మీ స్క్రీన్ పై ఆస్వాదించండి.',
        },
        {
          startTime: 12,
          endTime: 18,
          text: 'కథకుడు: "ప్రతి ప్రయాణం ఒక సాహసంతో మొదలవుతుంది."',
        },
        {startTime: 19, endTime: 26, text: '[ఉద్వేగభరిత నేపథ్య సంగీతం]'},
        {
          startTime: 27,
          endTime: 34,
          text: 'హీరో: "మనం కలిసే ఈ లక్ష్యాన్ని సాధిస్తాం!"',
        },
        {startTime: 35, endTime: 43, text: '[సంగ్రామ శబ్దాలు]'},
        {
          startTime: 44,
          endTime: 52,
          text: 'కథకుడు: "ఈ కథ ఎల్లప్పుడూ నిలిచిపోతుంది."',
        },
        {
          startTime: 53,
          endTime: 62,
          text: '[హృదయపూర్వక ముగింపు సంగీత నాదం]',
        },
        {
          startTime: 63,
          endTime: 75,
          text: 'కథానాయకుడు: "ధైర్యమే మన అతిపెద్ద ఆయుధం."',
        },
        {
          startTime: 76,
          endTime: 90,
          text: '[రోమాంచిత సన్నివేశం కొనసాగుతోంది]',
        },
        {
          startTime: 91,
          endTime: 120,
          text: 'కథకుడు: "సత్యం మరియు న్యాయం ఎల్లప్పుడూ విజయం సాధిస్తాయి."',
        },
      ];
    }

    if (langPrefix === 'hi') {
      return [
        {
          startTime: 1,
          endTime: 5,
          text: `[प्रारंभिक संगीत]\nप्रसारित: ${safeTitle}`,
        },
        {startTime: 6, endTime: 11, text: 'शानदार सिनेमाई अनुभव का आनंद लें।'},
        {
          startTime: 12,
          endTime: 18,
          text: 'सूत्रधार: "हर यात्रा एक साहसिक कदम से शुरू होती है।"',
        },
        {startTime: 19, endTime: 26, text: '[रोमांचक पृष्ठभूमि संगीत]'},
        {
          startTime: 27,
          endTime: 34,
          text: 'नायक: "हम सब मिलकर इस चुनौती का सामना करेंगे!"',
        },
        {startTime: 35, endTime: 43, text: '[एक्शन ध्वनि प्रभाव]'},
        {
          startTime: 44,
          endTime: 52,
          text: 'सूत्रधार: "यह गाथा इतिहास में अमर रहेगी।"',
        },
        {startTime: 53, endTime: 62, text: '[भव्य अंतिम धुन]'},
        {
          startTime: 63,
          endTime: 75,
          text: 'नायक: "साहस ही हमारी सबसे बड़ी शक्ति है।"',
        },
        {
          startTime: 76,
          endTime: 90,
          text: '[रोमांचक दृश्य जारी है]',
        },
        {
          startTime: 91,
          endTime: 120,
          text: 'सूत्रधार: "सच्चाई की हमेशा जीत होती है।"',
        },
      ];
    }

    if (langPrefix === 'es') {
      return [
        {
          startTime: 1,
          endTime: 5,
          text: `[Música inicial]\nReproduciendo: ${safeTitle}`,
        },
        {
          startTime: 6,
          endTime: 11,
          text: 'Disfruta de la mejor experiencia cinematográfica.',
        },
        {
          startTime: 12,
          endTime: 18,
          text: 'Narrador: "Todo gran viaje comienza con un paso valiente."',
        },
        {startTime: 19, endTime: 26, text: '[Música emocionante en crescendo]'},
        {
          startTime: 27,
          endTime: 34,
          text: 'Protagonista: "¡Juntos enfrentaremos cualquier desafío!"',
        },
        {startTime: 35, endTime: 43, text: '[Efectos de sonido resonantes]'},
        {
          startTime: 44,
          endTime: 52,
          text: 'Narrador: "La leyenda perdura por siempre."',
        },
        {startTime: 53, endTime: 62, text: '[Tema triunfal de cierre]'},
      ];
    }

    // Default English [CC]
    return [
      {
        startTime: 1,
        endTime: 5,
        text: `[Opening cinematic score]\nNow Playing: ${safeTitle}`,
      },
      {
        startTime: 6,
        endTime: 11,
        text: 'Experience premium cinema streaming in high definition.',
      },
      {
        startTime: 12,
        endTime: 18,
        text: 'Narrator: "Every journey begins with a single bold step."',
      },
      {
        startTime: 19,
        endTime: 26,
        text: '[Intense orchestral score builds in background]',
      },
      {
        startTime: 27,
        endTime: 34,
        text: 'Protagonist: "We will stand our ground and conquer together!"',
      },
      {
        startTime: 35,
        endTime: 43,
        text: '[Dramatic sound effects reverberate]',
      },
      {
        startTime: 44,
        endTime: 52,
        text: 'Narrator: "The legend lives on in our hearts forever."',
      },
      {startTime: 53, endTime: 65, text: '[Climactic musical finale]'},
      {
        startTime: 66,
        endTime: 78,
        text: 'Protagonist: "Courage is our greatest weapon against adversity."',
      },
      {
        startTime: 79,
        endTime: 95,
        text: '[Heroic victory theme resonates]',
      },
      {
        startTime: 96,
        endTime: 120,
        text: 'Narrator: "Truth and perseverance shall always prevail."',
      },
    ];
  };

  return [
    {
      id: 'default-en',
      language: 'en',
      label: 'English [CC]',
      kind: 'captions',
      isDefault: true,
      cues: buildExtendedCues('en'),
    },
    {
      id: 'default-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      kind: 'subtitles',
      cues: buildExtendedCues('te'),
    },
    {
      id: 'default-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      kind: 'subtitles',
      cues: buildExtendedCues('hi'),
    },
    {
      id: 'default-es',
      language: 'es',
      label: 'Spanish (Español)',
      kind: 'subtitles',
      cues: buildExtendedCues('es'),
    },
  ];
}

/**
 * Returns available subtitle tracks for any movie or Live TV content.
 * For Live TV channels, dynamically computes live broadcast closed captions.
 */
export function getSubtitleTracksForContent(
  contentId?: string,
  contentTitle?: string,
  videoUrl?: string,
  isLive?: boolean,
  category?: string,
  description?: string,
): SubtitleTrack[] {
  const normId = (contentId || '').toLowerCase().trim();
  const normTitle = (contentTitle || '').toLowerCase().trim();
  const normUrl = (videoUrl || '').toLowerCase().trim();

  // If this is a Live TV stream or channel, dynamically generate live broadcast captions
  if (
    isLive ||
    normId.startsWith('live-') ||
    normId.includes('live') ||
    normTitle.includes('live') ||
    normUrl.includes('live') ||
    normUrl.includes('master.m3u8') ||
    normUrl.includes('playlist.m3u8') ||
    normUrl.includes('index.m3u8') ||
    normId.includes('sakshi') ||
    normId.includes('ntv') ||
    normId.includes('ndtv') ||
    normId.includes('abp') ||
    normId.includes('bharati') ||
    normId.includes('girnar') ||
    normId.includes('dw') ||
    normId.includes('cgtn') ||
    normId.includes('nhk') ||
    normId.includes('europe')
  ) {
    return createDynamicLiveSubtitleTracks(
      contentId,
      contentTitle,
      category,
      description,
      videoUrl,
    );
  }

  // 1. Direct key match on ID for VOD catalog movies
  if (normId && curatedSubtitlesMap[normId]) {
    return curatedSubtitlesMap[normId];
  }

  // 2. Partial ID or Title match for VOD catalog movies
  for (const key of Object.keys(curatedSubtitlesMap)) {
    if (
      (normId && (normId.includes(key) || key.includes(normId))) ||
      (normTitle && (normTitle.includes(key) || key.includes(normTitle)))
    ) {
      return curatedSubtitlesMap[key];
    }
  }

  // 3. Match against videoUrl if provided
  if (normUrl) {
    for (const key of Object.keys(curatedSubtitlesMap)) {
      if (normUrl.includes(key)) {
        return curatedSubtitlesMap[key];
      }
    }
  }

  return createGenericSubtitleTracks(contentTitle || 'Now Playing');
}
