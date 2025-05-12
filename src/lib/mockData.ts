
import type { Contact } from '@/lib/types';

// Helper to parse birthday strings like "Month Day (Age)" or "Age"
const parseBirthday = (birthdayStr?: string, currentYear: number = 2024): string | undefined => {
  if (!birthdayStr) return undefined;

  let year, month, day;

  // Try "Month Day (Age)" e.g. "May 9 (23)"
  let match = birthdayStr.match(/(\w+)\s+(\d+)\s+\((\d+)\)/);
  if (match) {
    const [, monthName, dayStr, ageStr] = match;
    month = new Date(Date.parse(monthName + " 1, 2000")).getMonth() + 1; // Get month number
    day = parseInt(dayStr);
    year = currentYear - parseInt(ageStr);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Try "(Age)" e.g. "(60)" or "Age 60"
  match = birthdayStr.match(/\(?(\d+)\)?/);
   if (birthdayStr.startsWith('(') && birthdayStr.endsWith(')')) {
    match = birthdayStr.match(/\((\d+)\)/);
   } else {
     match = birthdayStr.match(/(\d+)/);
   }

  if (match) {
    const ageStr = match[1];
    year = currentYear - parseInt(ageStr);
    // Default to Jan 1 if only age is given
    return `${year}-01-01`;
  }
  
  // Try "Month Day, Year" e.g. "Oct 19, 22" (assuming 2022)
  match = birthdayStr.match(/(\w+)\s+(\d+),\s+(\d+)/);
  if (match) {
    const [, monthName, dayStr, yearStr] = match;
    month = new Date(Date.parse(monthName + " 1, 2000")).getMonth() + 1;
    day = parseInt(dayStr);
    year = parseInt(yearStr);
    if (year < 100) year += 2000; // Handle YY format
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }


  // If it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthdayStr)) {
    return birthdayStr;
  }

  console.warn("Could not parse birthday string:", birthdayStr);
  return undefined;
};


export const mockContacts: Contact[] = [
  // Chandra Oli (Updated)
  {
    id: "1",
    ownerId: "user1",
    name: "Chandra Oli",
    photoURL: "https://picsum.photos/seed/chandraoli/200/200",
    category: "Friend",
    tags: ["BNKS", "Univ. of Cincinnati", "Mechanical Engineer", "Kritipur", "Nepal"],
    locationDetails: "Kritipur, Nepal → Cincinnati, Ohio",
    occupation: "Mechanical Engineer",
    company: "Tech Innovations Inc.", // Assuming, not in new data
    college: "University of Cincinnati",
    socialProfiles: {
      linkedin: "https://linkedin.com/in/chandraoli1074/",
      instagram: "https://instagram.com/maalkarx/",
    },
    phone: "513 372 0338",
    email: "chandra.oli@example.com",
    birthday: parseBirthday("May 9 (23)"), // Approx 2001-05-09
    notes: "Met at BNKS.",
    relationships: [
      { relatedContactId: "2", type: "Partner", customLabel: "Girlfriend" },
      { relatedContactId: "ro_dad_co", type: "Parent", customLabel: "Father" },
      { relatedContactId: "ro_mom_co", type: "Parent", customLabel: "Mother" },
      { relatedContactId: "do_sis_co", type: "Sibling", customLabel: "Sister" },
    ],
    photosTogether: [
        "https://picsum.photos/seed/chandra_event1/300/200",
        "https://picsum.photos/seed/chandra_event2/300/200"
    ],
    notableEvents: [
      { id: 'event1_co', title: 'Graduation Day', date: '2020-05-15', description: 'Graduated from University of Cincinnati with a degree in Mechanical Engineering.' },
    ],
    createdAt: new Date("2022-01-10T10:00:00Z"),
    updatedAt: new Date(),
  },
  // Ritisha KC (Updated for Chandra's relationship)
  {
    id: "2",
    ownerId: "user1",
    name: "Ritisha", // Name changed from "Ritisha KC"
    photoURL: "https://picsum.photos/seed/ritisha/200/200",
    category: "Partner",
    tags: ["Nursing Student", "Cincinnati", "Healthcare"],
    locationDetails: "Cincinnati, OH",
    occupation: "Nursing Student",
    company: "University Hospital", // Assumed
    college: "University of Cincinnati", // Assumed from context
    socialProfiles: {
      instagram: "instagram.com/ritishakc", // Kept if applicable
    },
    email: "ritisha@example.com",
    birthday: parseBirthday("Oct 19 (22)"), // Approx 2002-10-19
    notes: "Chandra's girlfriend. Supportive partner. Loves to travel and try new foods.",
    relationships: [{ relatedContactId: "1", type: "Partner", customLabel: "Boyfriend" }],
    photosTogether: ["https://picsum.photos/seed/ritisha_trip/300/200"],
    notableEvents: [
      { id: 'event_r1_rkc', title: 'Anniversary with Chandra', date: '2021-09-10', description: 'Celebrated one year together.' },
    ],
    createdAt: new Date("2021-06-15T10:00:00Z"),
    updatedAt: new Date(),
  },
  // Abhas Oli (Updated)
  {
    id: "3",
    ownerId: "user1",
    name: "Abhas Oli",
    photoURL: "https://picsum.photos/seed/abhasoli/200/200",
    category: "Friend",
    tags: ["BNKS", "Beloit College", "Computer Science", "Gaming", "Kathmandu"],
    locationDetails: "Kathmandu, Nepal → Beloit, Wisconsin",
    occupation: "Student (Computer Science)",
    company: "Beloit College",
    college: "Beloit College",
    socialProfiles: {
        linkedin: "https://linkedin.com/in/abhas-oli-85a1251b6/",
        instagram: "https://instagram.com/abhas__olee/",
    },
    phone: "608 207 5923",
    email: "abhas.oli@example.com",
    birthday: parseBirthday("Nov 15 (23)"), // Approx 2001-11-15
    notes: "Met at BNKS. Younger brother's friend. Very bright and into competitive gaming.",
    relationships: [
        { relatedContactId: "k_g_ao", type: "Partner", customLabel: "Girlfriend" },
        { relatedContactId: "au_mom_ao", type: "Parent", customLabel: "Mother" },
        { relatedContactId: "bno_dad_ao", type: "Parent", customLabel: "Father" },
    ],
    photosTogether: [],
    notableEvents: [
        { id: 'event_ao1', title: 'Won Gaming Tournament', date: '2024-03-01', description: 'First place in the regional CS:GO tournament.'},
    ],
    createdAt: new Date("2023-03-20T10:00:00Z"),
    updatedAt: new Date(),
  },
  // Sam Hendrickson (Updated)
  {
    id: "4",
    ownerId: "user1",
    name: "Sam Hendrickson",
    photoURL: "https://picsum.photos/seed/samhendrickson/200/200",
    category: "Friend",
    tags: ["Gustavus Adolphus", "Biology", "Research", "Duluth", "Idaho"],
    locationDetails: "Duluth, Minnesota → Idaho",
    occupation: "Biology Major Student", // Updated
    company: "Gustavus Adolphus College", // Or Mayo if research is primary
    college: "Gustavus Adolphus College",
    socialProfiles: {
      instagram: "https://instagram.com/sam.hendrickson_/",
    },
    phone: "218 260 6265",
    email: "sam.hendrickson@example.com",
    birthday: parseBirthday("Feb 24 (22)"), // Approx 2002-02-24
    notes: "Met at Gustavus Adolphus College. Passionate about genetics.",
    relationships: [
        { relatedContactId: "emily_g", type: "Partner", customLabel: "Girlfriend" },
        { relatedContactId: "alpine_d", type: "Pet" },
        { relatedContactId: "shula_d", type: "Pet" },
        { relatedContactId: "sara_h", type: "Parent", customLabel: "Mother"},
        { relatedContactId: "john_h", type: "Parent", customLabel: "Father"},
        { relatedContactId: "greta_h", type: "Sibling", customLabel: "Sister"},
        { relatedContactId: "philip_e", type: "Uncle" },
        { relatedContactId: "ty_b", type: "Uncle" },
        { relatedContactId: "ryan_h", type: "Uncle" },
        { relatedContactId: "jim_e", type: "Grandparent", customLabel: "Grandfather"},
        { relatedContactId: "anne_e", type: "Grandparent", customLabel: "Grandmother"},
    ],
    photosTogether: [],
    notableEvents: [
        {id: 'event_sh1', title: 'Published Research Paper', date: '2023-11-20', description: 'Co-authored a paper on genetic markers.'}
    ],
    createdAt: new Date("2022-09-01T10:00:00Z"),
    updatedAt: new Date(),
  },
  // Dr. Emily Carter (Existing, no changes from new data)
  {
    id: "5",
    ownerId: "user1",
    name: "Dr. Emily Carter",
    photoURL: "https://picsum.photos/seed/emilycarter/200/200",
    category: "Professional",
    tags: ["Mentor", "Professor", "Physics"],
    locationDetails: "Stanford University",
    occupation: "Professor of Physics",
    company: "Stanford University",
    college: "Stanford University",
    email: "emily.carter@stanford.edu",
    notes: "PhD advisor and mentor. Incredibly supportive and knowledgeable.",
    relationships: [],
    photosTogether: [],
    notableEvents: [],
    createdAt: new Date("2018-08-20T10:00:00Z"),
    updatedAt: new Date("2024-02-15T12:45:00Z"),
  },

  // Sam's Connections (Update/Verify existing ones)
  { 
    id: "emily_g", 
    ownerId: "user1", 
    name: "Emily Grenecer", 
    photoURL: "https://picsum.photos/seed/emilygrenecer/200/200",
    occupation: "Peace Corps Volunteer", 
    locationDetails: "Portland, Maine", 
    category: "Partner", 
    tags: ["Partner", "Peace Corps"], 
    birthday: parseBirthday("24"), // User specified "(24; Portland...)" -> age 24, default to 2000-07-25 for consistency or make new
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [{ relatedContactId: "4", type: "Partner", customLabel: "Boyfriend" }], 
    photosTogether: [], 
    notableEvents: [] 
  },
  { 
    id: "alpine_d", 
    ownerId: "user1", 
    name: "Alpine", 
    photoURL: "https://picsum.photos/seed/alpine/200/200",
    category: "Pet", 
    tags: ["Dog", "Black Labrador"], 
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [{ relatedContactId: "4", type: "Owner" }], 
    photosTogether: [], 
    notableEvents: [{id: 'alpine_gotcha', title: 'Gotcha Day', date: '2022-05-20', description: 'Brought Alpine home!'}] 
  },
  { 
    id: "shula_d", 
    ownerId: "user1", 
    name: "Shula", 
    photoURL: "https://picsum.photos/seed/shula/200/200",
    category: "Pet", 
    tags: ["Dog", "Black Labrador"], 
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [{ relatedContactId: "4", type: "Owner" }], 
    photosTogether: [], 
    notableEvents: [{id: 'shula_gotcha', title: 'Gotcha Day', date: '2022-05-20', description: 'Brought Shula home!'}] 
  },
  { 
    id: "sara_h", 
    ownerId: "user1", 
    name: "Sara Eidsvold Hendrikson", // Full name updated
    photoURL: "https://picsum.photos/seed/sarahendrickson/200/200",
    category: "Family", 
    tags: ["Parent", "Mother"], 
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [{ relatedContactId: "4", type: "Child", customLabel:"Son" }], 
    photosTogether: [], 
    notableEvents: [] 
  },
  { 
    id: "john_h", 
    ownerId: "user1", 
    name: "John Hendrickson", 
    photoURL: "https://picsum.photos/seed/johnhendrickson/200/200",
    occupation: "DNR Engineer", 
    locationDetails: "Duluth", 
    category: "Family", 
    tags: ["Parent", "Father", "DNR"], 
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [{ relatedContactId: "4", type: "Child", customLabel:"Son" }], 
    photosTogether: [], 
    notableEvents: [{id: 'jh_work_anniv', title: 'Work Anniversary (DNR)', date: '2003-08-15', description: 'Started working at DNR.'}] 
  },
  { 
    id: "greta_h", 
    ownerId: "user1", 
    name: "Greta Hendrickson", 
    photoURL: "https://picsum.photos/seed/gretahendrickson/200/200",
    occupation: "Student", 
    locationDetails: "College in NY", 
    category: "Family", 
    tags: ["Sibling", "Sister", "Skiing"], 
    college: "College in NY", 
    birthday: parseBirthday("19"), // age 19 -> approx 2005-01-01
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [{ relatedContactId: "4", type: "Sibling", customLabel: "Brother" }], 
    photosTogether: [], 
    notableEvents: [] 
  },
  { 
    id: "philip_e", 
    ownerId: "user1", 
    name: "Philip Eidsvold", 
    photoURL: "https://picsum.photos/seed/philipeidsvold/200/200",
    occupation: "VP Marketing", 
    company: "One10", 
    locationDetails: "Edina, MN", 
    category: "Family", 
    tags: ["Uncle", "Marketing"], 
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [
        { relatedContactId: "4", type: "Nephew" },
        { relatedContactId: "ty_b", type: "Partner" } // Partner with Ty Baucum
    ], 
    photosTogether: [], 
    notableEvents: [] 
  },
  { 
    id: "ty_b", 
    ownerId: "user1", 
    name: "Ty Baucum", 
    photoURL: "https://picsum.photos/seed/tybaucum/200/200",
    occupation: "Owner", 
    company: "Wovenbyrd", 
    category: "Family", 
    tags: ["Uncle", "Business Owner"], 
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [
        { relatedContactId: "4", type: "Nephew" },
        { relatedContactId: "philip_e", type: "Partner" } // Partner with Philip Eidsvold
    ], 
    photosTogether: [], 
    notableEvents: [] 
  },
  { 
    id: "ryan_h", 
    ownerId: "user1", 
    name: "Ryan Hendrickson", 
    photoURL: "https://picsum.photos/seed/ryanhendrickson/200/200",
    category: "Family", 
    tags: ["Uncle"], 
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [{ relatedContactId: "4", type: "Nephew" }], 
    photosTogether: [], 
    notableEvents: [] 
  },
  { 
    id: "jim_e", 
    ownerId: "user1", 
    name: "Jim Eidsvold", 
    photoURL: "https://picsum.photos/seed/jimeidsvold/200/200",
    category: "Family", 
    tags: ["Grandparent", "Grandfather"], 
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [{ relatedContactId: "4", type: "Grandchild" }], 
    photosTogether: [], 
    notableEvents: [{ id: 'jim_anne_anniv', title: "Wedding Anniversary", date: '1965-06-12', description: "Jim and Anne's wedding day."}] 
  },
  { 
    id: "anne_e", 
    ownerId: "user1", 
    name: "Anne Eidsvold", 
    photoURL: "https://picsum.photos/seed/anneeidsvold/200/200",
    category: "Family", 
    tags: ["Grandparent", "Grandmother"], 
    createdAt: new Date(), 
    updatedAt: new Date(), 
    relationships: [{ relatedContactId: "4", type: "Grandchild" }], 
    photosTogether: [], 
    notableEvents: [] 
  },

  // Chandra's NEW Family
  {
    id: "ro_dad_co",
    ownerId: "user1",
    name: "Remanta Oli (Dad)",
    photoURL: "https://picsum.photos/seed/remantaolidad/200/200",
    category: "Family",
    tags: ["Parent", "Father"],
    relationships: [{ relatedContactId: "1", type: "Child", customLabel:"Son" }, {relatedContactId: "ro_mom_co", type: "Partner", customLabel: "Wife"}],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "ro_mom_co",
    ownerId: "user1",
    name: "Remanta Oli (Mom)",
    photoURL: "https://picsum.photos/seed/remantaolimom/200/200",
    category: "Family",
    tags: ["Parent", "Mother"],
    relationships: [{ relatedContactId: "1", type: "Child", customLabel:"Son" }, {relatedContactId: "ro_dad_co", type: "Partner", customLabel: "Husband"}],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "do_sis_co",
    ownerId: "user1",
    name: "Deepa Oli",
    photoURL: "https://picsum.photos/seed/deepaoli/200/200",
    category: "Family",
    occupation: "Nursing",
    locationDetails: "Australia",
    tags: ["Sibling", "Sister", "Nursing", "Australia"],
    relationships: [{ relatedContactId: "1", type: "Sibling", customLabel:"Brother" }],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },

  // Abhas' NEW Family/Partner
   {
    id: "k_g_ao", // Krisha, Abhas' Girlfriend
    ownerId: "user1",
    name: "Krisha",
    photoURL: "https://picsum.photos/seed/krisha/200/200",
    category: "Partner",
    tags: ["Girlfriend"],
    relationships: [{ relatedContactId: "3", type: "Partner", customLabel:"Boyfriend" }],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "au_mom_ao", // Apsara Uprety, Abhas' Mom
    ownerId: "user1",
    name: "Apsara Uprety",
    photoURL: "https://picsum.photos/seed/apsarauprety/200/200",
    category: "Family",
    tags: ["Parent", "Mother"],
    relationships: [{ relatedContactId: "3", type: "Child", customLabel:"Son" }, { relatedContactId: "bno_dad_ao", type: "Partner", customLabel: "Husband" }],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "bno_dad_ao", // Bishwa Nath Oli, Abhas' Dad
    ownerId: "user1",
    name: "Bishwa Nath Oli",
    photoURL: "https://picsum.photos/seed/bishwanatholi/200/200",
    category: "Family",
    occupation: "Retired Forestry Minister",
    locationDetails: "Nepal",
    tags: ["Parent", "Father", "Retired Forestry Minister", "Nepal"],
    relationships: [{ relatedContactId: "3", type: "Child", customLabel:"Son" }, { relatedContactId: "au_mom_ao", type: "Partner", customLabel: "Wife" }],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  
  // Curt Kowaleski (NEW) and his network
  {
    id: "ck_host",
    ownerId: "user1",
    name: "Curt Kowaleski",
    photoURL: "https://picsum.photos/seed/curtkowaleski/200/200",
    category: "Other", // Host Family
    tags: ["Host Family", "Wisconsin", "CFO"],
    locationDetails: "Wisconsin → Le Suer, Minnesota",
    occupation: "CFO",
    company: "GAC", // Gustavus Adolphus College?
    phone: "920 412 8327",
    birthday: parseBirthday("Jan 17 (60)"), // Approx 1964-01-17
    notes: "Host family from Wisconsin.",
    relationships: [
        { relatedContactId: "lk_wife_ck", type: "Partner", customLabel: "Wife" },
        { relatedContactId: "zk_son_ck", type: "Child", customLabel: "Son" },
        { relatedContactId: "at_d_ck", type: "Child", customLabel: "Daughter" },
        { relatedContactId: "cak_d_ck", type: "Child", customLabel: "Daughter" },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "lk_wife_ck", // Lori Kowaleski
    ownerId: "user1",
    name: "Lori Kowaleski",
    photoURL: "https://picsum.photos/seed/lorikowaleski/200/200",
    category: "Family",
    tags: ["Spouse"],
    birthday: parseBirthday("60"), // Approx 1964-01-01
    relationships: [{ relatedContactId: "ck_host", type: "Partner", customLabel: "Husband" }],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "zk_son_ck", // Zach Kowaleski
    ownerId: "user1",
    name: "Zach Kowaleski",
    photoURL: "https://picsum.photos/seed/zachkowaleski/200/200",
    category: "Family",
    tags: ["Son"],
    relationships: [
        { relatedContactId: "ck_host", type: "Parent", customLabel: "Father" },
        { relatedContactId: "lk_wife_ck", type: "Parent", customLabel: "Mother" },
        { relatedContactId: "r_zgf_ck", type: "Partner", customLabel: "Girlfriend" },
        { relatedContactId: "rgk_zd_ck", type: "Child", customLabel: "Daughter" },
        { relatedContactId: "b_zpet_ck", type: "Pet" },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "r_zgf_ck", // Rachel (Zach's GF)
    ownerId: "user1",
    name: "Rachel",
    photoURL: "https://picsum.photos/seed/rachel/200/200",
    category: "Partner",
    tags: ["Girlfriend"],
    relationships: [{ relatedContactId: "zk_son_ck", type: "Partner", customLabel: "Boyfriend" }],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "rgk_zd_ck", // Robin Grace Kowaleski
    ownerId: "user1",
    name: "Robin Grace Kowaleski",
    photoURL: "https://picsum.photos/seed/robingrace/200/200",
    category: "Family",
    tags: ["Grandchild", "Daughter"],
    relationships: [
        { relatedContactId: "zk_son_ck", type: "Parent", customLabel: "Father" },
        { relatedContactId: "r_zgf_ck", type: "Parent", customLabel: "Mother" } // Assuming Rachel is mother
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "b_zpet_ck", // Bootsy (Zach's Pet)
    ownerId: "user1",
    name: "Bootsy",
    photoURL: "https://picsum.photos/seed/bootsy/200/200",
    category: "Pet",
    tags: ["Pet"],
    relationships: [{ relatedContactId: "zk_son_ck", type: "Owner" }],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "at_d_ck", // Allison Terrance
    ownerId: "user1",
    name: "Allison Terrance",
    photoURL: "https://picsum.photos/seed/allisonterrance/200/200",
    category: "Family",
    tags: ["Daughter"],
    relationships: [
        { relatedContactId: "ck_host", type: "Parent", customLabel: "Father" },
        { relatedContactId: "lk_wife_ck", type: "Parent", customLabel: "Mother" },
        { relatedContactId: "mt_ah_ck", type: "Partner", customLabel: "Husband" },
        { relatedContactId: "ht_as1_ck", type: "Child", customLabel: "Son" },
        { relatedContactId: "ct_as2_ck", type: "Child", customLabel: "Son" },
        { relatedContactId: "mxt_as3_ck", type: "Child", customLabel: "Son" },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "mt_ah_ck", // Matt Terrance
    ownerId: "user1",
    name: "Matt Terrance",
    photoURL: "https://picsum.photos/seed/mattterrance/200/200",
    category: "Family",
    tags: ["Spouse"],
    relationships: [{ relatedContactId: "at_d_ck", type: "Partner", customLabel: "Wife" }],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "ht_as1_ck", // Harrison Terrance
    ownerId: "user1",
    name: "Harrison Terrance",
    photoURL: "https://picsum.photos/seed/harrisonterrance/200/200",
    category: "Family",
    tags: ["Grandchild", "Son"],
    relationships: [
        { relatedContactId: "at_d_ck", type: "Parent", customLabel: "Mother" },
        { relatedContactId: "mt_ah_ck", type: "Parent", customLabel: "Father" }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "ct_as2_ck", // Cooper Terrance
    ownerId: "user1",
    name: "Cooper Terrance",
    photoURL: "https://picsum.photos/seed/cooperterrance/200/200",
    category: "Family",
    tags: ["Grandchild", "Son"],
    relationships: [
        { relatedContactId: "at_d_ck", type: "Parent", customLabel: "Mother" },
        { relatedContactId: "mt_ah_ck", type: "Parent", customLabel: "Father" }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "mxt_as3_ck", // Max Terrance
    ownerId: "user1",
    name: "Max Terrance",
    photoURL: "https://picsum.photos/seed/maxterrance/200/200",
    category: "Family",
    tags: ["Grandchild", "Son"],
    relationships: [
        { relatedContactId: "at_d_ck", type: "Parent", customLabel: "Mother" },
        { relatedContactId: "mt_ah_ck", type: "Parent", customLabel: "Father" }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
  {
    id: "cak_d_ck", // Cassie Kowaleski
    ownerId: "user1",
    name: "Cassie Kowaleski",
    photoURL: "https://picsum.photos/seed/cassiekowaleski/200/200",
    category: "Family",
    tags: ["Daughter"],
    relationships: [
        { relatedContactId: "ck_host", type: "Parent", customLabel: "Father" },
        { relatedContactId: "lk_wife_ck", type: "Parent", customLabel: "Mother" },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    photosTogether: [],
    notableEvents: [],
  },
];
