import {
  AuditLog,
  Game,
  Player,
  Profile,
  ScoreAttempt,
  ScoreCorrectionHistory,
  ScoreCorrectionRequest,
  ScoringRule,
  VolunteerActivityItem,
} from "../types/database";
import { isSupabaseConfigured, createAdminClient } from "../lib/supabase/server";
import { calculateBestScoresPerGame, compareAttempts, evaluateAutomaticScore } from "./scoring-service";
import { normalizeRollNumber } from "../lib/utils";

// In-Memory Fallback State (Active when NEXT_PUBLIC_SUPABASE_URL is placeholder)
let memPlayers: Player[] = [
  {
    id: "f8539ae2-83db-53e9-9aca-7fbcb2599d15",
    full_name: "Praneeth Aggani",
    university_roll_number: "PAGGANI",
    university_email: "paggani@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-11T07:56:21.223Z",
    updated_at: "2026-10-11T07:56:21.223Z",
  },
  {
    id: "55ea60b3-ca54-53c7-bd27-68973e49ebc5",
    full_name: "Yash",
    university_roll_number: "YDHULIPA",
    university_email: "ydhulipa@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-11T06:44:05.268Z",
    updated_at: "2026-10-11T06:44:05.268Z",
  },
  {
    id: "15db6f3a-b76b-5ea8-b6cf-8351c696af39",
    full_name: "shashank parthigalla",
    university_roll_number: "SPARTHIGALLA",
    university_email: "sparthigalla@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-11T06:43:03.388Z",
    updated_at: "2026-10-11T06:43:03.388Z",
  },
  {
    id: "a8c3d978-3ad8-5bf2-9fd5-0b16227aee15",
    full_name: "Satwik",
    university_roll_number: "SRAI2",
    university_email: "srai2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-11T03:55:13.606Z",
    updated_at: "2026-10-11T03:55:13.606Z",
  },
  {
    id: "7e397671-e420-5b56-9438-cf53d7c5903d",
    full_name: "BHUVAANESH RADHAKRISHNAN",
    university_roll_number: "BRADHAKR",
    university_email: "bradhakr@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T18:35:15.535Z",
    updated_at: "2026-10-10T18:35:15.535Z",
  },
  {
    id: "5c203e27-296a-5d4c-a683-354a35ee373f",
    full_name: "Nikhileswar",
    university_roll_number: "NVEGI2",
    university_email: "nvegi2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T17:51:12.919Z",
    updated_at: "2026-10-10T17:51:12.919Z",
  },
  {
    id: "ee2c5dd8-3319-5793-ae66-c183e3f99a41",
    full_name: "Sarthak Ghosh",
    university_roll_number: "SARTHAKGHOSH2006",
    university_email: "sarthakghosh2006@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T16:11:08.082Z",
    updated_at: "2026-10-10T16:11:08.082Z",
  },
  {
    id: "b902f9dc-f811-5813-a358-bca73df7a218",
    full_name: "Roop Shankar",
    university_roll_number: "RMAITY",
    university_email: "rmaity@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T16:03:22.406Z",
    updated_at: "2026-10-10T16:03:22.406Z",
  },
  {
    id: "10d22ac5-35ad-5974-a231-c8119abffd9d",
    full_name: "Anurag Kashyap",
    university_roll_number: "ANURAG7DM",
    university_email: "anurag7dm@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T16:01:33.642Z",
    updated_at: "2026-10-10T16:01:33.642Z",
  },
  {
    id: "311524bb-9cc9-5633-ba51-8ee1a2c6f604",
    full_name: "Akshith Kalvakota",
    university_roll_number: "AKALVAKO",
    university_email: "akalvako@gitam.in",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T15:07:05.939Z",
    updated_at: "2026-10-10T15:07:05.939Z",
  },
  {
    id: "afdde09a-2188-5234-b362-31e357c94371",
    full_name: "NULU LIKITH SURYA KARTHIK",
    university_roll_number: "LNULU2",
    university_email: "lnulu2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T14:47:20.756Z",
    updated_at: "2026-10-10T14:47:20.756Z",
  },
  {
    id: "216d3b80-1770-562f-8af3-c61e403a42d9",
    full_name: "PRANAV",
    university_roll_number: "PDEVALLA",
    university_email: "pdevalla@gitam.in",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T09:42:48.613Z",
    updated_at: "2026-10-10T09:42:48.613Z",
  },
  {
    id: "4c66b081-4177-5df6-8ef7-e52208da4ba5",
    full_name: "Hrishi",
    university_roll_number: "HMEKA2",
    university_email: "hmeka2@gitam.in",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T09:18:14.117Z",
    updated_at: "2026-10-10T09:18:14.117Z",
  },
  {
    id: "72b25a49-d219-559d-9a51-f8c0a7cdfa6c",
    full_name: "Amrutha Sravya Kaipa",
    university_roll_number: "KAIPAAMRUTHASRAVYA",
    university_email: "kaipaamruthasravya@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T04:43:02.599Z",
    updated_at: "2026-10-10T04:43:02.599Z",
  },
  {
    id: "ece5579e-bdd4-5770-8ffe-66da81c112a6",
    full_name: "Bazzy",
    university_roll_number: "ANGRYCARROTIS69",
    university_email: "angrycarrotis69@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-10T04:09:37.209Z",
    updated_at: "2026-10-10T04:09:37.209Z",
  },
  {
    id: "13333342-5d89-5cb7-9e9a-90e165379b71",
    full_name: "Bhanu teja",
    university_roll_number: "BGANIPE",
    university_email: "bganipe@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T18:49:35.580Z",
    updated_at: "2026-10-09T18:49:35.580Z",
  },
  {
    id: "256de5c5-a1e7-5141-8332-c0df3e76e7dc",
    full_name: "Kaustubh Prasad",
    university_roll_number: "KPRASAD2",
    university_email: "kprasad2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T17:58:54.920Z",
    updated_at: "2026-10-09T17:58:54.920Z",
  },
  {
    id: "e5fc1a13-8ac0-58ad-8d39-f09ad6ffac06",
    full_name: "Mohammed Ashraf Tariq",
    university_roll_number: "AMOHAM18",
    university_email: "amoham18@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T17:36:17.478Z",
    updated_at: "2026-10-09T17:36:17.478Z",
  },
  {
    id: "0a68bae2-341d-5795-b0b1-d69ed392a7a7",
    full_name: "Praneeth Chary Panuganti",
    university_roll_number: "PPANUGAN",
    university_email: "ppanugan@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T17:16:52.907Z",
    updated_at: "2026-10-09T17:16:52.907Z",
  },
  {
    id: "cb71b924-9a2c-5df4-865c-040670d23db0",
    full_name: "Tejas Reddy",
    university_roll_number: "TEJASREDDYTHALLAPAKA1",
    university_email: "tejasreddythallapaka1@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T16:04:01.906Z",
    updated_at: "2026-10-09T16:04:01.906Z",
  },
  {
    id: "1544aae5-0db0-5252-85b1-b6f1bf7b1269",
    full_name: "GOLLA SREEDHAR AKSHIT",
    university_roll_number: "AGOLLA1",
    university_email: "agolla1@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T15:49:27.691Z",
    updated_at: "2026-10-09T15:49:27.691Z",
  },
  {
    id: "c2c58962-a7a0-56bf-a480-193bbfe0efb9",
    full_name: "Nikhil Peruka",
    university_roll_number: "NIKHILPERUKA7",
    university_email: "nikhilperuka7@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T15:30:28.778Z",
    updated_at: "2026-10-09T15:30:28.778Z",
  },
  {
    id: "8d0d46a4-ad55-53a0-b79b-900f668febf7",
    full_name: "Ranga Sudhansh",
    university_roll_number: "SRANGA",
    university_email: "sranga@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T14:52:50.329Z",
    updated_at: "2026-10-09T14:52:50.329Z",
  },
  {
    id: "e615b095-0236-5d99-9037-7787f261d0a0",
    full_name: "Bathina Arvind Kumar",
    university_roll_number: "ARVIND250206",
    university_email: "arvind250206@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T14:10:16.088Z",
    updated_at: "2026-10-09T14:10:16.088Z",
  },
  {
    id: "fae9945f-92e7-58a1-b306-ea314abe31f4",
    full_name: "Saketh",
    university_roll_number: "VANNADAT",
    university_email: "vannadat@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T13:45:55.987Z",
    updated_at: "2026-10-09T13:45:55.987Z",
  },
  {
    id: "884ea52c-e96e-5fdf-b6a2-83853938983c",
    full_name: "KALALI AVINASH",
    university_roll_number: "AKALALI2",
    university_email: "akalali2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T13:16:10.964Z",
    updated_at: "2026-10-09T13:16:10.964Z",
  },
  {
    id: "511368cc-9cd2-56d9-9e81-743919490dea",
    full_name: "Shourya",
    university_roll_number: "SHOURYA.CHARY",
    university_email: "shourya.chary@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T13:07:06.684Z",
    updated_at: "2026-10-09T13:07:06.684Z",
  },
  {
    id: "90ae6b0d-2d62-57f5-b5dd-e650c86c5117",
    full_name: "Atla Divyesh Reddy",
    university_roll_number: "DIVYESHATLA",
    university_email: "divyeshatla@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T12:58:40.913Z",
    updated_at: "2026-10-09T12:58:40.913Z",
  },
  {
    id: "9405ef2a-19fe-5c9f-92ca-6a902547bcf6",
    full_name: "Midhil Ch",
    university_roll_number: "CCHERUK2",
    university_email: "ccheruk2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T12:53:47.105Z",
    updated_at: "2026-10-09T12:53:47.105Z",
  },
  {
    id: "4ae76a5b-89ff-5afe-8249-752ca9b367a4",
    full_name: "Jayanth Kumar",
    university_roll_number: "JAYANTH0348P",
    university_email: "jayanth0348p@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T12:01:42.313Z",
    updated_at: "2026-10-09T12:01:42.313Z",
  },
  {
    id: "9b598fa4-a712-54ad-8efb-5ae12f6843fc",
    full_name: "V JAYASHREE",
    university_roll_number: "JVENKAT2",
    university_email: "jvenkat2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T11:10:56.902Z",
    updated_at: "2026-10-09T11:10:56.902Z",
  },
  {
    id: "fea74d75-d39f-5238-b19d-155311fb806f",
    full_name: "THOTLA ABHINAV CHANDRA YADAV",
    university_roll_number: "ATHOTLA",
    university_email: "athotla@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T10:55:34.390Z",
    updated_at: "2026-10-09T10:55:34.390Z",
  },
  {
    id: "7418b1e8-7960-5f3b-b76c-2c23b3aab5ac",
    full_name: "Sanvi",
    university_roll_number: "SPATHAP2",
    university_email: "spathap2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T10:55:23.106Z",
    updated_at: "2026-10-09T10:55:23.106Z",
  },
  {
    id: "da79c65e-fe54-50e1-bbc7-334b910c96e5",
    full_name: "T Naga Pranav",
    university_roll_number: "NP910890",
    university_email: "np910890@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T10:29:14.974Z",
    updated_at: "2026-10-09T10:29:14.974Z",
  },
  {
    id: "7657b10c-806e-54b8-a758-2ddeeade4c63",
    full_name: "Shrey Dwivedi",
    university_roll_number: "SDWIVEDI",
    university_email: "sdwivedi@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T09:15:59.574Z",
    updated_at: "2026-10-09T09:15:59.574Z",
  },
  {
    id: "961d8f06-df62-5970-b90f-6d9f44d60b39",
    full_name: "Sreyansh Acharya",
    university_roll_number: "SACHARYA",
    university_email: "sacharya@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T09:14:31.489Z",
    updated_at: "2026-10-09T09:14:31.489Z",
  },
  {
    id: "97e12860-55f1-50cc-bbee-a1f6c4a10532",
    full_name: "V.kunal Anand",
    university_roll_number: "KVEERAV1",
    university_email: "kveerav1@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T09:06:14.364Z",
    updated_at: "2026-10-09T09:06:14.364Z",
  },
  {
    id: "ea0101fa-15dc-564c-89dd-dfa8609c0acc",
    full_name: "Nigama",
    university_roll_number: "SNOMULA2",
    university_email: "snomula2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:56:07.307Z",
    updated_at: "2026-10-09T08:56:07.307Z",
  },
  {
    id: "5a2b2337-6f2d-5568-a3e9-2ef2ceeff964",
    full_name: "Eashanth Alli",
    university_roll_number: "EALLI",
    university_email: "ealli@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:53:08.806Z",
    updated_at: "2026-10-09T08:53:08.806Z",
  },
  {
    id: "742b357a-c51c-51fc-a617-4b6bde7f6f93",
    full_name: "Muralidhar",
    university_roll_number: "MURALI07DHAR",
    university_email: "murali07dhar@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:50:59.676Z",
    updated_at: "2026-10-09T08:50:59.676Z",
  },
  {
    id: "d3d2ad65-ae83-5bb1-8e7c-525b2dbba1f2",
    full_name: "Farhaan Ahmed",
    university_roll_number: "FARHAANAHMED5048",
    university_email: "farhaanahmed5048@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:48:34.895Z",
    updated_at: "2026-10-09T08:48:34.895Z",
  },
  {
    id: "43051ac9-fb03-50c5-9488-157a4255a22f",
    full_name: "Gyaneshwari",
    university_roll_number: "GSALUKU2",
    university_email: "gsaluku2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:40:39.851Z",
    updated_at: "2026-10-09T08:40:39.851Z",
  },
  {
    id: "c6a0866b-f6cb-5cb0-97cd-3fba4850c449",
    full_name: "A.Somnath Aneesh",
    university_roll_number: "SAKUNUR2",
    university_email: "sakunur2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:32:46.925Z",
    updated_at: "2026-10-09T08:32:46.925Z",
  },
  {
    id: "6ef951ce-1e90-54ed-bb39-0b7d7437b073",
    full_name: "Alampalli Ishaan",
    university_roll_number: "IALAMPAL",
    university_email: "ialampal@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:32:35.170Z",
    updated_at: "2026-10-09T08:32:35.170Z",
  },
  {
    id: "f825a8dc-671e-5e44-a652-02f5fe06b006",
    full_name: "Gajula Shiva Priya",
    university_roll_number: "SGAJULA4",
    university_email: "sgajula4@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:32:24.626Z",
    updated_at: "2026-10-09T08:32:24.626Z",
  },
  {
    id: "47e12c14-80e9-535e-a917-406e78bcedbd",
    full_name: "Vishnu",
    university_roll_number: "VVARAGAN",
    university_email: "vvaragan@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:30:05.759Z",
    updated_at: "2026-10-09T08:30:05.759Z",
  },
  {
    id: "62e12dde-8103-514d-bf5f-1dea416bf1dd",
    full_name: "Rithvik Ch",
    university_roll_number: "SCHERUK3",
    university_email: "scheruk3@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:13:56.161Z",
    updated_at: "2026-10-09T08:13:56.161Z",
  },
  {
    id: "9c396eb8-3657-5b9a-9a31-dce7801cc0b6",
    full_name: "Siddha Madishetti",
    university_roll_number: "SIDDHAMADISHETTI08",
    university_email: "siddhamadishetti08@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:12:40.618Z",
    updated_at: "2026-10-09T08:12:40.618Z",
  },
  {
    id: "7fe10c0d-4e44-54c5-8128-8b16fd2e5d50",
    full_name: "Abhijit",
    university_roll_number: "SGUDIPA2",
    university_email: "sgudipa2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:12:10.840Z",
    updated_at: "2026-10-09T08:12:10.840Z",
  },
  {
    id: "9a712f13-3bfa-5eee-97aa-11fd7cca6c74",
    full_name: "Deepak M",
    university_roll_number: "KMUKTHAV",
    university_email: "kmukthav@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T08:12:01.773Z",
    updated_at: "2026-10-09T08:12:01.773Z",
  },
  {
    id: "fac6577e-5e74-59a6-9fdd-1c81c5ca06be",
    full_name: "M Jeshith",
    university_roll_number: "JMEKALA",
    university_email: "jmekala@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T07:54:11.204Z",
    updated_at: "2026-10-09T07:54:11.204Z",
  },
  {
    id: "77f921c1-a2fe-5669-b62d-0d8911864764",
    full_name: "shubham kumar",
    university_roll_number: "SKUMAR14",
    university_email: "skumar14@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T07:51:43.848Z",
    updated_at: "2026-10-09T07:51:43.848Z",
  },
  {
    id: "d686902b-005e-5ed8-a352-2d2e2b096d7c",
    full_name: "ujwal kandukuri",
    university_roll_number: "UJWALKANDUKURI1",
    university_email: "ujwalkandukuri1@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T07:40:41.302Z",
    updated_at: "2026-10-09T07:40:41.302Z",
  },
  {
    id: "f0aa4a91-bd24-51e3-920e-c869c995738f",
    full_name: "Tshedup Ghissing",
    university_roll_number: "TGHISSIN",
    university_email: "tghissin@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T07:39:52.207Z",
    updated_at: "2026-10-09T07:39:52.207Z",
  },
  {
    id: "12446340-68ca-5f9f-93a8-5f13794e0800",
    full_name: "Jush",
    university_roll_number: "JUSHSHAH4",
    university_email: "jushshah4@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T07:30:21.863Z",
    updated_at: "2026-10-09T07:30:21.863Z",
  },
  {
    id: "60aae632-80a8-5450-9ee9-63abd19647e7",
    full_name: "Ansh Konda",
    university_roll_number: "ANSH957072",
    university_email: "ansh957072@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T07:23:40.468Z",
    updated_at: "2026-10-09T07:23:40.468Z",
  },
  {
    id: "c3654e3f-97d2-5a9b-b0ff-fe356284a349",
    full_name: "Manas Kasina",
    university_roll_number: "SKASINA1",
    university_email: "skasina1@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T07:23:40.129Z",
    updated_at: "2026-10-09T07:23:40.129Z",
  },
  {
    id: "7296d27d-fd80-51c4-a629-ff7153f1f4e5",
    full_name: "Srihitha Pichika",
    university_roll_number: "SPICHIK2",
    university_email: "spichik2@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T07:22:12.411Z",
    updated_at: "2026-10-09T07:22:12.411Z",
  },
  {
    id: "608919b9-74b7-5d08-b1bf-613629c02c9a",
    full_name: "Samuel",
    university_roll_number: "SURAGANASAMUELVIJAYKUMAR",
    university_email: "suraganasamuelvijaykumar@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T07:22:08.510Z",
    updated_at: "2026-10-09T07:22:08.510Z",
  },
  {
    id: "67ed318d-f1f7-5e66-b807-04e06d002b6b",
    full_name: "M.S.S.Mukunda Reddy",
    university_roll_number: "SMEDAPAT",
    university_email: "smedapat@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T07:15:19.561Z",
    updated_at: "2026-10-09T07:15:19.561Z",
  },
  {
    id: "9c8d9a77-7d6a-5e7e-a5d9-e4f43e311145",
    full_name: "Kirti",
    university_roll_number: "KARORA",
    university_email: "karora@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T06:59:13.240Z",
    updated_at: "2026-10-09T06:59:13.240Z",
  },
  {
    id: "8f0d7ea3-2baa-5088-934e-85f16148f4ed",
    full_name: "Sushanth",
    university_roll_number: "SAM.SUSHANTH26",
    university_email: "sam.sushanth26@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T05:20:00.518Z",
    updated_at: "2026-10-09T05:20:00.518Z",
  },
  {
    id: "3a345fdc-9805-5e4d-9916-31d937681b5f",
    full_name: "sai pranav",
    university_roll_number: "SCIDDAM",
    university_email: "sciddam@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T05:18:32.316Z",
    updated_at: "2026-10-09T05:18:32.316Z",
  },
  {
    id: "6663a3eb-845a-52a3-95ac-3d0c8952df10",
    full_name: "Divye Das",
    university_roll_number: "DIVYE.DAS",
    university_email: "divye.das@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T05:05:41.246Z",
    updated_at: "2026-10-09T05:05:41.246Z",
  },
  {
    id: "20609ba7-41a5-5ab8-b329-bc63504a082a",
    full_name: "K Siddharth",
    university_roll_number: "SKATIKAR",
    university_email: "skatikar@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-09T00:18:26.863Z",
    updated_at: "2026-10-09T00:18:26.863Z",
  },
  {
    id: "1d0270c2-7af2-51ec-8077-63752810ea46",
    full_name: "Arun sai",
    university_roll_number: "AMARAM",
    university_email: "amaram@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-08T18:21:52.090Z",
    updated_at: "2026-10-08T18:21:52.090Z",
  },
  {
    id: "a65c853e-7117-5d3d-a1e8-faaffb74f4ee",
    full_name: "SAI HARSHA ALLIKA",
    university_roll_number: "ALLIKASAIHARSHA1",
    university_email: "allikasaiharsha1@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-08T18:20:15.398Z",
    updated_at: "2026-10-08T18:20:15.398Z",
  },
  {
    id: "9f6981a8-edf0-5e33-be11-ea0b79f83973",
    full_name: "Mahit",
    university_roll_number: "MCHILUVE",
    university_email: "mchiluve@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-08T17:16:04.571Z",
    updated_at: "2026-10-08T17:16:04.571Z",
  },
  {
    id: "47247371-f4c5-5119-958a-b13fd96f22b6",
    full_name: "G. Praneeth",
    university_roll_number: "PGADDE",
    university_email: "pgadde@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-08T17:12:15.583Z",
    updated_at: "2026-10-08T17:12:15.583Z",
  },
  {
    id: "7abedb80-c8a1-5e7b-acc7-fa24a4734d44",
    full_name: "Manne Rajeev",
    university_roll_number: "RMANNE",
    university_email: "rmanne@student.gitam.edu",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-08T16:19:21.959Z",
    updated_at: "2026-10-08T16:19:21.959Z",
  },
  {
    id: "ec022713-dcb8-532c-8244-90b9f23740df",
    full_name: "Chaitanya",
    university_roll_number: "CHAITANYABULUSU3",
    university_email: "chaitanyabulusu3@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-08T16:07:50.947Z",
    updated_at: "2026-10-08T16:07:50.947Z",
  },
  {
    id: "f8f90e98-473c-56c9-8d2b-271478bf5e2a",
    full_name: "Ankur Shukla",
    university_roll_number: "ANKUR.SHUKLA8702",
    university_email: "ankur.shukla8702@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-04T08:47:22.666Z",
    updated_at: "2026-10-04T08:47:22.666Z",
  },
  {
    id: "2d681ff7-7d15-501c-a939-897e2d46efe0",
    full_name: "SRI SHASHANK PYDI",
    university_roll_number: "SHASHANK.PYDI",
    university_email: "shashank.pydi@gmail.com",
    mobile_number: null,
    discovery_source: "Luma",
    is_active: true,
    created_at: "2026-10-04T08:31:31.669Z",
    updated_at: "2026-10-04T08:31:31.669Z",
  },
];

let memGames: Game[] = [
  {
    id: "03804296-2263-5c46-937b-4b2a24703746",
    name: "Super Mario",
    description: null,
    is_active: true,
    scoring_status: "open",
    created_at: "2026-10-11T00:00:00.000Z",
    updated_at: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "037676a7-2ef2-5a1b-b8af-7feb81c5cd05",
    name: "Mario Kart",
    description: null,
    is_active: true,
    scoring_status: "open",
    created_at: "2026-10-11T00:00:00.000Z",
    updated_at: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "d9944c54-77cc-5e48-ad2b-7b7599ce877c",
    name: "PAC-MAN",
    description: null,
    is_active: true,
    scoring_status: "open",
    created_at: "2026-10-11T00:00:00.000Z",
    updated_at: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "0f0bd199-8988-5d2b-a531-4dacf12dc82c",
    name: "Road Rash",
    description: null,
    is_active: true,
    scoring_status: "open",
    created_at: "2026-10-11T00:00:00.000Z",
    updated_at: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "c8fc96fc-f70d-5b83-881e-1fbd6d8a602c",
    name: "Mortal Kombat",
    description: null,
    is_active: true,
    scoring_status: "open",
    created_at: "2026-10-11T00:00:00.000Z",
    updated_at: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "0cc8d3ef-c4c0-51d7-947a-63d71a46a45c",
    name: "Call of Duty: Modern Warfare 2 (2007)",
    description: null,
    is_active: true,
    scoring_status: "open",
    created_at: "2026-10-11T00:00:00.000Z",
    updated_at: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "9c75eb3f-0a5a-5271-b498-bf1fac5224d0",
    name: "Contra",
    description: null,
    is_active: true,
    scoring_status: "open",
    created_at: "2026-10-11T00:00:00.000Z",
    updated_at: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "3edfa81e-4f21-5b1a-a95b-81bddce3851b",
    name: "Street Fighter II",
    description: null,
    is_active: true,
    scoring_status: "open",
    created_at: "2026-10-11T00:00:00.000Z",
    updated_at: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "cf65bb2c-87ca-5a4b-8025-e2a556066023",
    name: "Need for Speed: Most Wanted",
    description: null,
    is_active: true,
    scoring_status: "open",
    created_at: "2026-10-11T00:00:00.000Z",
    updated_at: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "9491c94e-b554-5a8e-a5bc-eb4b3a6a2387",
    name: "Crash Bandicoot",
    description: null,
    is_active: true,
    scoring_status: "open",
    created_at: "2026-10-11T00:00:00.000Z",
    updated_at: "2026-10-11T00:00:00.000Z",
  },
];

let memScoringRules: ScoringRule[] = [];

let memScoreAttempts: ScoreAttempt[] = [];

let memCorrectionRequests: ScoreCorrectionRequest[] = [];
let memCorrectionHistory: ScoreCorrectionHistory[] = [];
let memAuditLogs: AuditLog[] = [];

let memProfiles: Profile[] = [
  {
    id: "b5a1e29d-eed5-4685-8136-9add7d03d77b",
    display_name: "Volunteer Station",
    role: "volunteer",
    volunteer_code: "VOL-01",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6feb3768-7f68-4bdf-b840-e7a444809389",
    display_name: "Tournament Admin",
    role: "admin",
    volunteer_code: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper to populate relations on an attempt
function populateAttempt(att: ScoreAttempt): ScoreAttempt {
  const p = att.player || memPlayers.find((x) => x.id === att.player_id);
  const g = att.game || memGames.find((x) => x.id === att.game_id);
  const v =
    att.volunteer ||
    memProfiles.find((x) => x.id === att.volunteer_id || x.volunteer_code === att.volunteer_id);
  return {
    ...att,
    player: p,
    game: g,
    volunteer: v || {
      id: att.volunteer_id,
      display_name: "Unknown Volunteer",
      role: "volunteer",
      volunteer_code: "N/A",
      is_active: true,
      created_at: att.created_at || new Date().toISOString(),
      updated_at: att.updated_at || new Date().toISOString(),
    },
  };
}

// -------------------------------------------------------------
// DATA SERVICE IMPLEMENTATION
// -------------------------------------------------------------

export const DataStore = {
  async getOrCreateVolunteerProfile(params: {
    volunteerCode: string;
    displayName: string;
  }): Promise<Profile> {
    const normalizedCode = params.volunteerCode.trim().toUpperCase();
    const displayName = params.displayName.trim();

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();

      // Check existing profile by volunteer code
      const { data: existing } = await supa
        .from("profiles")
        .select("*")
        .eq("volunteer_code", normalizedCode)
        .maybeSingle();

      if (existing) {
        if (displayName && existing.display_name !== displayName) {
          const { data: updated } = await supa
            .from("profiles")
            .update({ display_name: displayName, updated_at: new Date().toISOString() })
            .eq("id", existing.id)
            .select()
            .single();
          if (updated) {
            const idx = memProfiles.findIndex((p) => p.id === updated.id);
            if (idx !== -1) memProfiles[idx] = updated;
            else memProfiles.push(updated);
            return updated;
          }
        }
        return existing;
      }

      // Create new auth user and profile
      const sanitizedCode = normalizedCode.toLowerCase().replace(/[^a-z0-9]/g, "");
      const email = `vol_${sanitizedCode}_${Date.now()}@retroreboot.cogaan.local`;
      const { data: userRes } = await supa.auth.admin.createUser({
        email,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { role: "volunteer", volunteer_code: normalizedCode, display_name: displayName },
      });

      if (userRes?.user?.id) {
        const newProfile: Profile = {
          id: userRes.user.id,
          display_name: displayName || `Volunteer ${normalizedCode}`,
          role: "volunteer",
          volunteer_code: normalizedCode,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insErr } = await supa
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        if (!insErr && inserted) {
          const idx = memProfiles.findIndex((p) => p.id === inserted.id);
          if (idx !== -1) memProfiles[idx] = inserted;
          else memProfiles.push(inserted);
          return inserted;
        }
      }
    }

    // In-memory fallback
    const existingMem = memProfiles.find((p) => p.volunteer_code === normalizedCode);
    if (existingMem) {
      if (displayName) existingMem.display_name = displayName;
      return existingMem;
    }

    const newMemProfile: Profile = {
      id: crypto.randomUUID(),
      display_name: displayName || `Volunteer ${normalizedCode}`,
      role: "volunteer",
      volunteer_code: normalizedCode,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memProfiles.push(newMemProfile);
    return newMemProfile;
  },

  async getVolunteerProfileById(idOrCode: string): Promise<Profile | null> {
    if (!idOrCode) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const query = isUuid
        ? supa.from("profiles").select("*").eq("id", idOrCode).maybeSingle()
        : supa.from("profiles").select("*").eq("volunteer_code", idOrCode.toUpperCase()).maybeSingle();
      const { data } = await query;
      if (data) return data;
    }
    return (
      memProfiles.find(
        (p) => p.id === idOrCode || (p.volunteer_code && p.volunteer_code === idOrCode.toUpperCase())
      ) || null
    );
  },

  async getPlayers(): Promise<Player[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa.from("players").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        memPlayers = data;
        return data;
      }
    }
    return [...memPlayers];
  },

  async getPlayerById(id: string): Promise<Player | null> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data } = await supa.from("players").select("*").eq("id", id).single();
      if (data) {
        const idx = memPlayers.findIndex((p) => p.id === data.id);
        if (idx !== -1) memPlayers[idx] = data;
        else memPlayers.push(data);
        return data;
      }
    }
    return memPlayers.find((p) => p.id === id) || null;
  },

  async createPlayer(playerData: Omit<Player, "id" | "created_at" | "updated_at">): Promise<Player> {
    const normalizedRoll = normalizeRollNumber(playerData.university_roll_number);

    // Duplicate check
    const existing = memPlayers.find((p) => p.university_roll_number === normalizedRoll);
    if (existing) {
      throw new Error(`Player with Roll Number ${normalizedRoll} is already registered`);
    }

    const newPlayer: Player = {
      ...playerData,
      id: crypto.randomUUID(),
      university_roll_number: normalizedRoll,
      university_email: playerData.university_email?.trim() || "",
      mobile_number: playerData.mobile_number?.trim() || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa.from("players").insert(newPlayer).select().single();
      if (error) throw new Error(error.message);
      if (data) {
        memPlayers.unshift(data);
        return data;
      }
    }

    memPlayers.unshift(newPlayer);
    this.logAudit({
      action_type: "player_registered",
      entity_type: "players",
      entity_id: newPlayer.id,
      player_id: newPlayer.id,
      new_values: newPlayer,
    });
    return newPlayer;
  },

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    const p = await this.getPlayerById(id);
    if (!p) throw new Error("Player not found");

    if (updates.university_roll_number) {
      updates.university_roll_number = normalizeRollNumber(updates.university_roll_number);
      const conflict = memPlayers.find((x) => x.id !== id && x.university_roll_number === updates.university_roll_number);
      if (conflict) throw new Error(`Roll Number ${updates.university_roll_number} is already in use`);
    }

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa
        .from("players")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        const idx = memPlayers.findIndex((x) => x.id === id);
        if (idx !== -1) memPlayers[idx] = data;
        else memPlayers.push(data);
        return data;
      }
    }

    const updated = { ...p, ...updates, updated_at: new Date().toISOString() };
    const index = memPlayers.findIndex((x) => x.id === id);
    if (index !== -1) memPlayers[index] = updated;

    this.logAudit({
      action_type: "player_updated",
      entity_type: "players",
      entity_id: id,
      player_id: id,
      old_values: p,
      new_values: updated,
    });
    return updated;
  },

  async getGames(): Promise<Game[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa.from("games").select("*").order("name");
      if (!error && data) {
        memGames = data;
        return data;
      }
    }
    return [...memGames];
  },

  async getGameById(id: string): Promise<Game | null> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data } = await supa.from("games").select("*").eq("id", id).single();
      if (data) {
        const idx = memGames.findIndex((g) => g.id === data.id);
        if (idx !== -1) memGames[idx] = data;
        else memGames.push(data);
        return data;
      }
    }
    return memGames.find((g) => g.id === id) || null;
  },

  async createGame(gameData: Omit<Game, "id" | "created_at" | "updated_at">): Promise<Game> {
    const newGame: Game = {
      ...gameData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa.from("games").insert(newGame).select().single();
      if (error) throw new Error(error.message);
      if (data) {
        memGames.push(data);
        return data;
      }
    }

    memGames.push(newGame);
    this.logAudit({
      action_type: "game_created",
      entity_type: "games",
      entity_id: newGame.id,
      game_id: newGame.id,
      new_values: newGame,
    });
    return newGame;
  },

  async updateGame(id: string, updates: Partial<Game>): Promise<Game> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa
        .from("games")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        const idx = memGames.findIndex((x) => x.id === id);
        if (idx !== -1) memGames[idx] = data;
        return data;
      }
    }

    const g = memGames.find((x) => x.id === id);
    if (!g) throw new Error("Game not found");
    const updated = { ...g, ...updates, updated_at: new Date().toISOString() };
    const idx = memGames.findIndex((x) => x.id === id);
    if (idx !== -1) memGames[idx] = updated;
    this.logAudit({
      action_type: "game_updated",
      entity_type: "games",
      entity_id: id,
      game_id: id,
      old_values: g,
      new_values: updated,
    });
    return updated;
  },

  async deleteGame(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      // Delete in FK dependency order for this game
      await supa.from("score_correction_history").delete().or(`old_game_id.eq.${id},new_game_id.eq.${id}`);
      await supa.from("score_correction_requests").delete().or(`original_game_id.eq.${id},requested_game_id.eq.${id}`);
      await supa.from("score_attempts").delete().eq("game_id", id);
      await supa.from("scoring_rules").delete().eq("game_id", id);
      const { error } = await supa.from("games").delete().eq("id", id);
      if (error) throw new Error(error.message);
    }

    const g = memGames.find((x) => x.id === id);
    memGames = memGames.filter((x) => x.id !== id);
    memScoringRules = memScoringRules.filter((r) => r.game_id !== id);
    memScoreAttempts = memScoreAttempts.filter((a) => a.game_id !== id);
    memCorrectionRequests = memCorrectionRequests.filter((cr) => cr.original_game_id !== id && cr.requested_game_id !== id);
    memCorrectionHistory = memCorrectionHistory.filter((ch) => ch.old_game_id !== id && ch.new_game_id !== id);

    this.logAudit({
      action_type: "game_deleted",
      entity_type: "games",
      entity_id: id,
      game_id: id,
      old_values: g || { id },
    });
  },

  async getScoringRules(gameId?: string): Promise<ScoringRule[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      let q = supa.from("scoring_rules").select("*").eq("is_active", true);
      if (gameId) q = q.eq("game_id", gameId);
      const { data } = await q;
      if (data) return data;
    }
    if (gameId) {
      return memScoringRules.filter((r) => r.game_id === gameId && r.is_active);
    }
    return memScoringRules.filter((r) => r.is_active);
  },

  async addScoringRule(rule: Omit<ScoringRule, "id" | "created_at">): Promise<ScoringRule> {
    const newRule: ScoringRule = {
      ...rule,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa.from("scoring_rules").insert(newRule).select().single();
      if (error) throw new Error(error.message);
      if (data) {
        memScoringRules.push(data);
        return data;
      }
    }

    memScoringRules.push(newRule);
    this.logAudit({
      action_type: "scoring_rule_added",
      entity_type: "scoring_rules",
      entity_id: newRule.id,
      game_id: newRule.game_id,
      new_values: newRule,
    });
    return newRule;
  },

  async deleteScoringRule(ruleId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { error } = await supa.from("scoring_rules").delete().eq("id", ruleId);
      if (error) throw new Error(error.message);
    }

    const idx = memScoringRules.findIndex((r) => r.id === ruleId);
    if (idx !== -1) {
      const removed = memScoringRules[idx];
      memScoringRules.splice(idx, 1);
      this.logAudit({
        action_type: "scoring_rule_deleted",
        entity_type: "scoring_rules",
        entity_id: ruleId,
        game_id: removed.game_id,
        old_values: removed,
      });
    }
  },

  async submitScore(params: {
    player_id: string;
    game_id: string;
    volunteer_id: string;
    scoring_method: "manual" | "automatic";
    raw_score?: number | null;
    awarded_points?: number;
    idempotency_key: string;
  }): Promise<ScoreAttempt> {
    // Idempotency check
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data: existingSupa } = await supa
        .from("score_attempts")
        .select("*, player:players(*), game:games(*)")
        .eq("idempotency_key", params.idempotency_key)
        .maybeSingle();

      if (existingSupa) {
        return populateAttempt(existingSupa as ScoreAttempt);
      }
    }

    const existingAttempt = memScoreAttempts.find((a) => a.idempotency_key === params.idempotency_key);
    if (existingAttempt) {
      return populateAttempt(existingAttempt);
    }

    // Verify game exists and is open
    const game = await this.getGameById(params.game_id);
    if (!game || !game.is_active || game.scoring_status === "closed") {
      throw new Error(`Scoring is currently closed for ${game?.name || "this game"}`);
    }

    // Verify player exists and is active
    const player = await this.getPlayerById(params.player_id);
    if (!player || !player.is_active) {
      throw new Error("Selected player is not active or registered");
    }

    let finalPoints: number;
    let ruleId: string | null = null;
    let ruleVersion: number | null = null;

    if (params.scoring_method === "automatic") {
      if (params.raw_score === undefined || params.raw_score === null) {
        throw new Error("Raw score is required in Automatic Mode");
      }
      const activeRules = await this.getScoringRules(params.game_id);
      const evalRes = evaluateAutomaticScore(params.raw_score, activeRules);
      if (!evalRes.success || evalRes.points === undefined) {
        throw new Error(evalRes.errorMessage || "Unable to calculate points for this score");
      }
      finalPoints = evalRes.points;
      ruleId = evalRes.ruleId || null;
      ruleVersion = evalRes.ruleVersion || 1;
    } else {
      // Manual Mode
      if (!params.awarded_points || params.awarded_points < 1 || params.awarded_points > 100) {
        throw new Error("Points must be an integer between 1 and 100");
      }
      finalPoints = params.awarded_points;
    }

    // Resolve volunteer ID to verified profile
    let resolvedVolunteerId = params.volunteer_id;
    const resolvedProfile = await this.getVolunteerProfileById(params.volunteer_id);
    if (resolvedProfile) {
      resolvedVolunteerId = resolvedProfile.id;
    } else {
      const newProf = await this.getOrCreateVolunteerProfile({
        volunteerCode: params.volunteer_id,
        displayName: `Volunteer ${params.volunteer_id.toUpperCase()}`,
      });
      resolvedVolunteerId = newProf.id;
    }

    const attempt: ScoreAttempt = {
      id: crypto.randomUUID(),
      player_id: params.player_id,
      game_id: params.game_id,
      volunteer_id: resolvedVolunteerId,
      scoring_method: params.scoring_method,
      raw_score: params.raw_score !== undefined ? params.raw_score : null,
      awarded_points: finalPoints,
      scoring_rule_id: ruleId,
      rule_version: ruleVersion,
      idempotency_key: params.idempotency_key,
      status: "accepted",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      player: player,
      game: game,
    };

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();

      const { data, error } = await supa
        .from("score_attempts")
        .insert({
          id: attempt.id,
          player_id: attempt.player_id,
          game_id: attempt.game_id,
          volunteer_id: resolvedVolunteerId,
          scoring_method: attempt.scoring_method,
          raw_score: attempt.raw_score,
          awarded_points: attempt.awarded_points,
          scoring_rule_id: attempt.scoring_rule_id,
          rule_version: attempt.rule_version,
          idempotency_key: attempt.idempotency_key,
          status: attempt.status,
          created_at: attempt.created_at,
          updated_at: attempt.updated_at,
        })
        .select("*, player:players(*), game:games(*), volunteer:profiles(*)")
        .single();

      if (error) {
        console.error("Supabase score_attempts insert failed:", error);
        throw new Error(`Failed to save score: ${error.message}`);
      }

      if (!data) {
        throw new Error("Score insertion returned no data");
      }

      if (data.player) attempt.player = data.player;
      if (data.game) attempt.game = data.game;
      if (data.volunteer) attempt.volunteer = data.volunteer;
    }

    memScoreAttempts.unshift(attempt);

    this.logAudit({
      action_type: "score_submitted",
      entity_type: "score_attempts",
      entity_id: attempt.id,
      player_id: attempt.player_id,
      game_id: attempt.game_id,
      volunteer_id: attempt.volunteer_id,
      new_values: attempt,
    });

    return populateAttempt(attempt);
  },

  async getRecentAttempts(volunteerId?: string, limit: number = 50): Promise<ScoreAttempt[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      let q = supa
        .from("score_attempts")
        .select("*, player:players(*), game:games(*), volunteer:profiles(*)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (volunteerId) {
        q = q.eq("volunteer_id", volunteerId);
      }

      const { data, error } = await q;
      if (!error && data) {
        return data.map((d: any) => ({
          ...d,
          volunteer: d.volunteer || {
            id: d.volunteer_id,
            display_name: "Unknown Volunteer",
            role: "volunteer",
            volunteer_code: "N/A",
            is_active: true,
            created_at: d.created_at,
            updated_at: d.updated_at,
          },
        }));
      }
    }
    let list = [...memScoreAttempts];
    if (volunteerId) {
      list = list.filter((a) => a.volunteer_id === volunteerId);
    }
    return list.slice(0, limit).map(populateAttempt);
  },

  async getAllScoreAttempts(): Promise<ScoreAttempt[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data, error } = await supa
        .from("score_attempts")
        .select("*, player:players(*), game:games(*), volunteer:profiles(*)")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          ...d,
          volunteer: d.volunteer || {
            id: d.volunteer_id,
            display_name: "Unknown Volunteer",
            role: "volunteer",
            volunteer_code: "N/A",
            is_active: true,
            created_at: d.created_at,
            updated_at: d.updated_at,
          },
        }));
      }
    }
    return memScoreAttempts.map(populateAttempt);
  },

  async createCorrectionRequest(params: {
    original_attempt_id: string;
    requested_player_id: string;
    requested_game_id: string;
    requested_scoring_method: "manual" | "automatic";
    requested_raw_score?: number | null;
    requested_points: number;
    reason: string;
    requested_by: string;
  }): Promise<ScoreCorrectionRequest> {
    let orig: ScoreAttempt | null = null;
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data } = await supa.from("score_attempts").select("*").eq("id", params.original_attempt_id).maybeSingle();
      if (data) orig = data;
    }
    if (!orig) {
      orig = memScoreAttempts.find((a) => a.id === params.original_attempt_id) || null;
    }
    if (!orig) throw new Error("Original score attempt not found");

    // Resolve volunteer ID
    let resolvedVolunteerId = params.requested_by;
    const prof = await this.getVolunteerProfileById(resolvedVolunteerId);
    if (prof) {
      resolvedVolunteerId = prof.id;
    }

    const req: ScoreCorrectionRequest = {
      id: crypto.randomUUID(),
      original_attempt_id: orig.id,
      original_player_id: orig.player_id,
      original_game_id: orig.game_id,
      original_raw_score_snapshot: orig.raw_score,
      original_points_snapshot: orig.awarded_points,
      original_scoring_method: orig.scoring_method,

      requested_player_id: params.requested_player_id,
      requested_game_id: params.requested_game_id,
      requested_scoring_method: params.requested_scoring_method,
      requested_raw_score: params.requested_raw_score !== undefined ? params.requested_raw_score : null,
      requested_points: params.requested_points,

      reason: params.reason,
      requested_by: resolvedVolunteerId,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { error } = await supa.from("score_correction_requests").insert(req);
      if (error) {
        console.error("Supabase insert score_correction_requests error:", error);
        throw new Error(`Failed to submit correction request: ${error.message}`);
      }
    }

    memCorrectionRequests.unshift(req);

    this.logAudit({
      action_type: "correction_requested",
      entity_type: "score_correction_requests",
      entity_id: req.id,
      player_id: req.requested_player_id,
      game_id: req.requested_game_id,
      volunteer_id: resolvedVolunteerId,
      reason: req.reason,
      new_values: req,
    });

    return this.populateCorrectionRequest(req);
  },

  populateCorrectionRequest(r: ScoreCorrectionRequest): ScoreCorrectionRequest {
    const v = memProfiles.find((x) => x.id === r.requested_by || x.volunteer_code === r.requested_by);
    return {
      ...r,
      original_attempt: memScoreAttempts.find((a) => a.id === r.original_attempt_id),
      original_player: memPlayers.find((p) => p.id === r.original_player_id),
      original_game: memGames.find((g) => g.id === r.original_game_id),
      requested_player: memPlayers.find((p) => p.id === r.requested_player_id),
      requested_game: memGames.find((g) => g.id === r.requested_game_id),
      volunteer: v || {
        id: r.requested_by,
        display_name: "Unknown Volunteer",
        role: "volunteer",
        volunteer_code: "N/A",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  },

  async getCorrectionRequests(status?: "pending" | "approved" | "rejected"): Promise<ScoreCorrectionRequest[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      let q = supa
        .from("score_correction_requests")
        .select(`
          *,
          original_attempt:score_attempts(*),
          original_player:players!score_correction_requests_original_player_id_fkey(*),
          original_game:games!score_correction_requests_original_game_id_fkey(*),
          requested_player:players!score_correction_requests_requested_player_id_fkey(*),
          requested_game:games!score_correction_requests_requested_game_id_fkey(*),
          volunteer:profiles!score_correction_requests_requested_by_fkey(*)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        q = q.eq("status", status);
      }
      const { data, error } = await q;
      if (!error && data) {
        return data as ScoreCorrectionRequest[];
      }
    }

    let list = [...memCorrectionRequests];
    if (status) {
      list = list.filter((r) => r.status === status);
    }
    return list.map((r) => this.populateCorrectionRequest(r));
  },

  async reviewCorrectionRequest(params: {
    request_id: string;
    admin_id: string;
    decision: "approved" | "rejected";
    decision_reason?: string;
  }): Promise<ScoreCorrectionRequest> {
    let req: ScoreCorrectionRequest | null = null;
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();
      const { data } = await supa
        .from("score_correction_requests")
        .select("*")
        .eq("id", params.request_id)
        .maybeSingle();
      if (data) req = data;
    }
    if (!req) {
      req = memCorrectionRequests.find((r) => r.id === params.request_id) || null;
    }
    if (!req) throw new Error("Correction request not found");
    if (req.status !== "pending") throw new Error("This request has already been reviewed");

    // Resolve valid admin_id UUID for Supabase
    let supaAdminId = params.admin_id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supaAdminId);
    if (!isUuid) {
      supaAdminId = "6feb3768-7f68-4bdf-b840-e7a444809389"; // registered default tournament admin profile
    }

    if (params.decision === "approved") {
      // Validate requested points
      if (req.requested_points < 1 || req.requested_points > 100) {
        throw new Error(`Requested points must be between 1 and 100 (got ${req.requested_points})`);
      }

      if (isSupabaseConfigured()) {
        const supa = createAdminClient();

        // 1. Try atomic PostgreSQL RPC if deployed
        let rpcSucceeded = false;
        try {
          const { data: rpcData, error: rpcErr } = await supa.rpc("approve_score_correction", {
            p_request_id: req.id,
            p_admin_id: supaAdminId,
            p_decision_reason: params.decision_reason || "Approved by administrator",
          });
          if (!rpcErr && rpcData?.success) {
            rpcSucceeded = true;
          }
        } catch {
          // Fall back to client transactional updates below
        }

        if (!rpcSucceeded) {
          // 2. Client-side sequential atomic updates with verification:
          // Verify still pending
          const { data: currentReq } = await supa
            .from("score_correction_requests")
            .select("*")
            .eq("id", req.id)
            .eq("status", "pending")
            .single();

          if (!currentReq) {
            throw new Error("Score correction request has already been processed or is not pending");
          }

          // Supersede all other active attempts for target player-game combination
          await supa
            .from("score_attempts")
            .update({ status: "superseded", updated_at: new Date().toISOString() })
            .eq("player_id", req.requested_player_id)
            .eq("game_id", req.requested_game_id)
            .neq("id", req.original_attempt_id)
            .eq("status", "accepted");

          // Update the target attempt as the official accepted result
          const { error: attErr } = await supa
            .from("score_attempts")
            .update({
              player_id: req.requested_player_id,
              game_id: req.requested_game_id,
              scoring_method: req.requested_scoring_method,
              raw_score: req.requested_raw_score,
              awarded_points: req.requested_points,
              status: "accepted",
              updated_at: new Date().toISOString(),
            })
            .eq("id", req.original_attempt_id);

          if (attErr) {
            throw new Error(`Failed to apply score correction to attempt: ${attErr.message}`);
          }

          // Record in immutable score_correction_history
          const historyId = crypto.randomUUID();
          await supa.from("score_correction_history").insert({
            id: historyId,
            request_id: req.id,
            attempt_id: req.original_attempt_id,
            old_player_id: req.original_player_id,
            new_player_id: req.requested_player_id,
            old_game_id: req.original_game_id,
            new_game_id: req.requested_game_id,
            old_scoring_method: req.original_scoring_method,
            new_scoring_method: req.requested_scoring_method,
            previous_raw_score: req.original_raw_score_snapshot,
            new_raw_score: req.requested_raw_score,
            previous_points: req.original_points_snapshot,
            new_points: req.requested_points,
            approved_by: supaAdminId,
            approved_at: new Date().toISOString(),
          });

          // Mark request approved
          await supa
            .from("score_correction_requests")
            .update({
              status: "approved",
              reviewed_by: supaAdminId,
              reviewed_at: new Date().toISOString(),
              decision_reason: params.decision_reason || "Approved by administrator",
              updated_at: new Date().toISOString(),
            })
            .eq("id", req.id);

          // Append to audit_logs
          await supa.from("audit_logs").insert({
            id: crypto.randomUUID(),
            actor_user_id: supaAdminId,
            actor_role_snapshot: "admin",
            action_type: "correction_approved",
            entity_type: "score_attempts",
            entity_id: req.original_attempt_id,
            player_id: req.requested_player_id,
            game_id: req.requested_game_id,
            volunteer_id: req.requested_by,
            reason: req.reason,
            request_id: req.id,
            created_at: new Date().toISOString(),
          });
        }
      }

      // Sync in-memory fallback state:
      // Supersede all other attempts for target player and game
      for (const a of memScoreAttempts) {
        if (
          a.player_id === req.requested_player_id &&
          a.game_id === req.requested_game_id &&
          a.id !== req.original_attempt_id &&
          a.status === "accepted"
        ) {
          a.status = "superseded";
          a.updated_at = new Date().toISOString();
        }
      }

      const origAttemptIndex = memScoreAttempts.findIndex((a) => a.id === req.original_attempt_id);
      if (origAttemptIndex !== -1) {
        const origAttempt = memScoreAttempts[origAttemptIndex];
        const updatedAttempt: ScoreAttempt = {
          ...origAttempt,
          player_id: req.requested_player_id,
          game_id: req.requested_game_id,
          scoring_method: req.requested_scoring_method,
          raw_score: req.requested_raw_score,
          awarded_points: req.requested_points,
          status: "accepted",
          updated_at: new Date().toISOString(),
        };
        memScoreAttempts[origAttemptIndex] = updatedAttempt;
      }

      req.status = "approved";
      req.reviewed_by = params.admin_id;
      req.reviewed_at = new Date().toISOString();
      req.decision_reason = params.decision_reason || null;
      req.updated_at = new Date().toISOString();

      const historyRecord: ScoreCorrectionHistory = {
        id: crypto.randomUUID(),
        request_id: req.id,
        attempt_id: req.original_attempt_id,
        old_player_id: req.original_player_id,
        new_player_id: req.requested_player_id,
        old_game_id: req.original_game_id,
        new_game_id: req.requested_game_id,
        old_scoring_method: req.original_scoring_method,
        new_scoring_method: req.requested_scoring_method,
        previous_raw_score: req.original_raw_score_snapshot,
        new_raw_score: req.requested_raw_score,
        previous_points: req.original_points_snapshot,
        new_points: req.requested_points,
        approved_by: params.admin_id,
        approved_at: new Date().toISOString(),
      };
      memCorrectionHistory.push(historyRecord);

      this.logAudit({
        action_type: "correction_approved",
        entity_type: "score_attempts",
        entity_id: req.original_attempt_id,
        player_id: req.requested_player_id,
        game_id: req.requested_game_id,
        volunteer_id: req.requested_by,
        reason: req.reason,
        request_id: req.id,
      });
    } else {
      // Rejection
      if (isSupabaseConfigured()) {
        const supa = createAdminClient();
        await supa
          .from("score_correction_requests")
          .update({
            status: "rejected",
            reviewed_by: supaAdminId,
            reviewed_at: new Date().toISOString(),
            decision_reason: params.decision_reason || "Admin rejected correction",
            updated_at: new Date().toISOString(),
          })
          .eq("id", req.id);

        await supa.from("audit_logs").insert({
          id: crypto.randomUUID(),
          actor_user_id: supaAdminId,
          actor_role_snapshot: "admin",
          action_type: "correction_rejected",
          entity_type: "score_correction_requests",
          entity_id: req.id,
          player_id: req.requested_player_id,
          game_id: req.requested_game_id,
          volunteer_id: req.requested_by,
          reason: params.decision_reason || "Admin rejected correction",
          request_id: req.id,
          created_at: new Date().toISOString(),
        });
      }

      req.status = "rejected";
      req.reviewed_by = params.admin_id;
      req.reviewed_at = new Date().toISOString();
      req.decision_reason = params.decision_reason || null;
      req.updated_at = new Date().toISOString();

      this.logAudit({
        action_type: "correction_rejected",
        entity_type: "score_correction_requests",
        entity_id: req.id,
        player_id: req.requested_player_id,
        game_id: req.requested_game_id,
        volunteer_id: req.requested_by,
        reason: params.decision_reason || "Admin rejected correction",
      });
    }

    return this.populateCorrectionRequest(req);
  },

  async getVolunteerActivity(): Promise<VolunteerActivityItem[]> {
    if (isSupabaseConfigured()) {
      const supa = createAdminClient();

      const [attemptsRes, requestsRes] = await Promise.all([
        supa
          .from("score_attempts")
          .select("*, player:players(*), game:games(*), volunteer:profiles(*)")
          .order("created_at", { ascending: false })
          .limit(100),
        supa
          .from("score_correction_requests")
          .select(`
            *,
            requested_player:players!score_correction_requests_requested_player_id_fkey(*),
            requested_game:games!score_correction_requests_requested_game_id_fkey(*),
            volunteer:profiles!score_correction_requests_requested_by_fkey(*)
          `)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const activities: VolunteerActivityItem[] = [];

      if (attemptsRes.data && attemptsRes.data.length > 0) {
        for (const att of attemptsRes.data) {
          activities.push({
            id: att.id,
            volunteer_id: att.volunteer_id,
            volunteer_name: att.volunteer?.display_name || "Unknown Volunteer",
            volunteer_code: att.volunteer?.volunteer_code || "N/A",
            player_roll_number: att.player?.university_roll_number || "Unknown",
            player_name: att.player?.full_name || "Unknown",
            game_name: att.game?.name || "Unknown",
            action: "Score Submitted",
            score_change: att.raw_score !== null && att.raw_score !== undefined ? String(att.raw_score) : "Direct Manual",
            points_change: `${att.awarded_points} pts`,
            timestamp: att.created_at,
            status: att.status,
          });
        }
      }

      if (requestsRes.data && requestsRes.data.length > 0) {
        for (const req of requestsRes.data) {
          activities.push({
            id: req.id,
            volunteer_id: req.requested_by,
            volunteer_name: req.volunteer?.display_name || "Unknown Volunteer",
            volunteer_code: req.volunteer?.volunteer_code || "N/A",
            player_roll_number: req.requested_player?.university_roll_number || "Unknown",
            player_name: req.requested_player?.full_name || "Unknown",
            game_name: req.requested_game?.name || "Unknown",
            action: `Correction ${req.status === "approved" ? "Approved" : req.status === "rejected" ? "Rejected" : "Requested"}`,
            score_change: `${req.original_raw_score_snapshot ?? "Manual"} -> ${req.requested_raw_score ?? "Manual"}`,
            points_change: `${req.original_points_snapshot} -> ${req.requested_points} pts`,
            timestamp: req.updated_at || req.created_at,
            status: req.status,
            correction_details: `Reason: ${req.reason}${req.decision_reason ? ` | Admin note: ${req.decision_reason}` : ""}`,
          });
        }
      }

      if (activities.length > 0) {
        return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    }

    // In-memory fallback
    const activities: VolunteerActivityItem[] = [];

    for (const att of memScoreAttempts) {
      const p = memPlayers.find((x) => x.id === att.player_id);
      const g = memGames.find((x) => x.id === att.game_id);
      const v = memProfiles.find((x) => x.id === att.volunteer_id || x.volunteer_code === att.volunteer_id);
      activities.push({
        id: att.id,
        volunteer_id: att.volunteer_id,
        volunteer_name: v?.display_name || "Unknown Volunteer",
        volunteer_code: v?.volunteer_code || "N/A",
        player_roll_number: p?.university_roll_number || "Unknown",
        player_name: p?.full_name || "Unknown",
        game_name: g?.name || "Unknown",
        action: "Score Submitted",
        score_change: att.raw_score !== null ? String(att.raw_score) : "Direct Manual",
        points_change: `${att.awarded_points} pts`,
        timestamp: att.created_at,
        status: att.status,
      });
    }

    for (const req of memCorrectionRequests) {
      const p = memPlayers.find((x) => x.id === req.requested_player_id);
      const g = memGames.find((x) => x.id === req.requested_game_id);
      const v = memProfiles.find((x) => x.id === req.requested_by || x.volunteer_code === req.requested_by);
      activities.push({
        id: req.id,
        volunteer_id: req.requested_by,
        volunteer_name: v?.display_name || "Unknown Volunteer",
        volunteer_code: v?.volunteer_code || "N/A",
        player_roll_number: p?.university_roll_number || "Unknown",
        player_name: p?.full_name || "Unknown",
        game_name: g?.name || "Unknown",
        action: `Correction ${req.status === "approved" ? "Approved" : req.status === "rejected" ? "Rejected" : "Requested"}`,
        score_change: `${req.original_raw_score_snapshot ?? "Manual"} -> ${req.requested_raw_score ?? "Manual"}`,
        points_change: `${req.original_points_snapshot} -> ${req.requested_points} pts`,
        timestamp: req.updated_at || req.created_at,
        status: req.status,
        correction_details: `Reason: ${req.reason}${req.decision_reason ? ` | Admin note: ${req.decision_reason}` : ""}`,
      });
    }

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getLeaderboard() {
    const players = await this.getPlayers();
    const attempts = await this.getAllScoreAttempts();

    // Only active players are eligible for public leaderboard
    const activePlayers = players.filter((p) => p.is_active);
    const playersById = new Map<string, Player>(activePlayers.map((player) => [player.id, player]));
    for (const attempt of attempts) {
      if (attempt.player && attempt.player.is_active && !playersById.has(attempt.player_id)) {
        playersById.set(attempt.player_id, attempt.player);
      }
    }

    const attemptsByPlayer = new Map<string, ScoreAttempt[]>();
    for (const att of attempts) {
      if (att.status !== "accepted") continue;
      if (!attemptsByPlayer.has(att.player_id)) {
        attemptsByPlayer.set(att.player_id, []);
      }
      attemptsByPlayer.get(att.player_id)!.push(att);
    }

    const leaderboard = Array.from(playersById.values()).map((player) => {
      const pAttempts = attemptsByPlayer.get(player.id) || [];
      const bestMap = calculateBestScoresPerGame(pAttempts);

      let totalPoints = 0;
      let earliestEntry: number | null = null;
      const gameScores: Record<string, { raw_score: number | null; points: number }> = {};

      for (const [gameId, bestAtt] of Array.from(bestMap.entries())) {
        totalPoints += bestAtt.awarded_points;
        gameScores[gameId] = {
          raw_score: bestAtt.raw_score,
          points: bestAtt.awarded_points,
        };
        const t = new Date(bestAtt.created_at).getTime();
        if (earliestEntry === null || t < earliestEntry) {
          earliestEntry = t;
        }
      }

      return {
        player_id: player.id,
        full_name: player.full_name,
        university_roll_number: player.university_roll_number,
        total_points: totalPoints,
        games_played: bestMap.size,
        game_scores: gameScores,
        earliest_entry: earliestEntry,
      };
    });

    // Sort by total points descending, then earliest entry ascending
    leaderboard.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      if (a.earliest_entry && b.earliest_entry) {
        return a.earliest_entry - b.earliest_entry;
      }
      return 0;
    });

    return leaderboard.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  },

  logAudit(log: Omit<AuditLog, "id" | "created_at">) {
    const newLog: AuditLog = {
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    memAuditLogs.unshift(newLog);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return [...memAuditLogs];
  },

  async flushData(options?: {
    flushScores?: boolean;
    flushPlayers?: boolean;
    flushGames?: boolean;
    flushAuditLogs?: boolean;
  }) {
    const flushScores = options?.flushScores ?? true;
    const flushPlayers = options?.flushPlayers ?? true;
    const flushGames = options?.flushGames ?? false;
    const flushAuditLogs = options?.flushAuditLogs ?? true;

    if (isSupabaseConfigured()) {
      const supa = createAdminClient();

      // Delete in strict foreign-key order
      if (flushScores || flushPlayers || flushGames) {
        // 1. Correction History
        const { error: e1 } = await supa.from("score_correction_history").delete().not("id", "is", null);
        if (e1) console.warn("Supabase flush score_correction_history warning:", e1.message);

        // 2. Correction Requests
        const { error: e2 } = await supa.from("score_correction_requests").delete().not("id", "is", null);
        if (e2) console.warn("Supabase flush score_correction_requests warning:", e2.message);

        // 3. Score Attempts
        const { error: e3 } = await supa.from("score_attempts").delete().not("id", "is", null);
        if (e3) console.warn("Supabase flush score_attempts warning:", e3.message);
      }

      // 4. Audit Logs
      if (flushAuditLogs) {
        const { error: e4 } = await supa.from("audit_logs").delete().not("id", "is", null);
        if (e4) console.warn("Supabase flush audit_logs warning:", e4.message);
      }

      // 5. Players
      if (flushPlayers) {
        const { error: e5 } = await supa.from("players").delete().not("id", "is", null);
        if (e5) console.warn("Supabase flush players warning:", e5.message);
      }

      // 6. Games & Rules
      if (flushGames) {
        const { error: e6 } = await supa.from("scoring_rules").delete().not("id", "is", null);
        if (e6) console.warn("Supabase flush scoring_rules warning:", e6.message);

        const { error: e7 } = await supa.from("games").delete().not("id", "is", null);
        if (e7) console.warn("Supabase flush games warning:", e7.message);
      }
    }

    // Always clear the in-memory fallback state too
    if (flushScores || flushPlayers || flushGames) {
      memCorrectionHistory = [];
      memCorrectionRequests = [];
      memScoreAttempts = [];
    }

    if (flushAuditLogs) {
      memAuditLogs = [];
    }

    if (flushPlayers) {
      memPlayers = [];
    }

    if (flushGames) {
      memScoringRules = [];
      memGames = [];
    }

    return {
      success: true,
      flushed: {
        scores: flushScores || flushPlayers || flushGames,
        players: flushPlayers,
        games: flushGames,
        auditLogs: flushAuditLogs,
      },
    };
  },
};
