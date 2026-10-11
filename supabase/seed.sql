-- ==============================================================================
-- RETRO REBOOT BY COGAAN (RETRO 2.0) - SEED DATA
-- Default event settings, games, scoring rules, and registered participants
-- ==============================================================================

-- 1. EVENT SETTINGS
-- PIN hashes are configured through server environment variables.
INSERT INTO public.event_settings (id, event_name, event_room, event_date, event_time, scoring_open, results_published, admin_pin_hash, volunteer_pin_hash)
VALUES (
    1,
    'COGAAN Retro Reboot 2.0',
    'Manjeera',
    '12th Oct',
    '9am-4pm',
    true,
    true,
    '481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
)
ON CONFLICT (id) DO UPDATE SET
    event_name = EXCLUDED.event_name,
    event_room = EXCLUDED.event_room,
    event_date = EXCLUDED.event_date,
    event_time = EXCLUDED.event_time;

-- 2. TOURNAMENT GAMES
-- (No score-to-points rules are configured; configure them from the Admin > Games page or use manual points.)
INSERT INTO public.games (id, name, description, is_active, scoring_status)
VALUES
    ('03804296-2263-5c46-937b-4b2a24703746', 'Super Mario', NULL, true, 'open'),
    ('037676a7-2ef2-5a1b-b8af-7feb81c5cd05', 'Mario Kart', NULL, true, 'open'),
    ('d9944c54-77cc-5e48-ad2b-7b7599ce877c', 'PAC-MAN', NULL, true, 'open'),
    ('0f0bd199-8988-5d2b-a531-4dacf12dc82c', 'Road Rash', NULL, true, 'open'),
    ('c8fc96fc-f70d-5b83-881e-1fbd6d8a602c', 'Mortal Kombat', NULL, true, 'open'),
    ('0cc8d3ef-c4c0-51d7-947a-63d71a46a45c', 'Call of Duty: Modern Warfare 2 (2007)', NULL, true, 'open'),
    ('9c75eb3f-0a5a-5271-b498-bf1fac5224d0', 'Contra', NULL, true, 'open'),
    ('3edfa81e-4f21-5b1a-a95b-81bddce3851b', 'Street Fighter II', NULL, true, 'open'),
    ('cf65bb2c-87ca-5a4b-8025-e2a556066023', 'Need for Speed: Most Wanted', NULL, true, 'open'),
    ('9491c94e-b554-5a8e-a5bc-eb4b3a6a2387', 'Crash Bandicoot', NULL, true, 'open')
ON CONFLICT (name) DO NOTHING;

-- 3. REGISTERED PLAYERS (Luma guest list, 2026-10-11)
-- university_roll_number is the email handle (no roll numbers were in the export); mobile numbers were not collected.
INSERT INTO public.players (id, full_name, university_roll_number, university_email, mobile_number, discovery_source, is_active, created_at)
VALUES
    ('f8539ae2-83db-53e9-9aca-7fbcb2599d15', 'Praneeth Aggani', 'PAGGANI', 'paggani@student.gitam.edu', NULL, 'Luma', true, '2026-10-11T07:56:21.223Z'),
    ('55ea60b3-ca54-53c7-bd27-68973e49ebc5', 'Yash', 'YDHULIPA', 'ydhulipa@student.gitam.edu', NULL, 'Luma', true, '2026-10-11T06:44:05.268Z'),
    ('15db6f3a-b76b-5ea8-b6cf-8351c696af39', 'shashank parthigalla', 'SPARTHIGALLA', 'sparthigalla@gmail.com', NULL, 'Luma', true, '2026-10-11T06:43:03.388Z'),
    ('a8c3d978-3ad8-5bf2-9fd5-0b16227aee15', 'Satwik', 'SRAI2', 'srai2@student.gitam.edu', NULL, 'Luma', true, '2026-10-11T03:55:13.606Z'),
    ('7e397671-e420-5b56-9438-cf53d7c5903d', 'BHUVAANESH RADHAKRISHNAN', 'BRADHAKR', 'bradhakr@student.gitam.edu', NULL, 'Luma', true, '2026-10-10T18:35:15.535Z'),
    ('5c203e27-296a-5d4c-a683-354a35ee373f', 'Nikhileswar', 'NVEGI2', 'nvegi2@student.gitam.edu', NULL, 'Luma', true, '2026-10-10T17:51:12.919Z'),
    ('ee2c5dd8-3319-5793-ae66-c183e3f99a41', 'Sarthak Ghosh', 'SARTHAKGHOSH2006', 'sarthakghosh2006@gmail.com', NULL, 'Luma', true, '2026-10-10T16:11:08.082Z'),
    ('b902f9dc-f811-5813-a358-bca73df7a218', 'Roop Shankar', 'RMAITY', 'rmaity@student.gitam.edu', NULL, 'Luma', true, '2026-10-10T16:03:22.406Z'),
    ('10d22ac5-35ad-5974-a231-c8119abffd9d', 'Anurag Kashyap', 'ANURAG7DM', 'anurag7dm@gmail.com', NULL, 'Luma', true, '2026-10-10T16:01:33.642Z'),
    ('311524bb-9cc9-5633-ba51-8ee1a2c6f604', 'Akshith Kalvakota', 'AKALVAKO', 'akalvako@gitam.in', NULL, 'Luma', true, '2026-10-10T15:07:05.939Z'),
    ('afdde09a-2188-5234-b362-31e357c94371', 'NULU LIKITH SURYA KARTHIK', 'LNULU2', 'lnulu2@student.gitam.edu', NULL, 'Luma', true, '2026-10-10T14:47:20.756Z'),
    ('216d3b80-1770-562f-8af3-c61e403a42d9', 'PRANAV', 'PDEVALLA', 'pdevalla@gitam.in', NULL, 'Luma', true, '2026-10-10T09:42:48.613Z'),
    ('4c66b081-4177-5df6-8ef7-e52208da4ba5', 'Hrishi', 'HMEKA2', 'hmeka2@gitam.in', NULL, 'Luma', true, '2026-10-10T09:18:14.117Z'),
    ('72b25a49-d219-559d-9a51-f8c0a7cdfa6c', 'Amrutha Sravya Kaipa', 'KAIPAAMRUTHASRAVYA', 'kaipaamruthasravya@gmail.com', NULL, 'Luma', true, '2026-10-10T04:43:02.599Z'),
    ('ece5579e-bdd4-5770-8ffe-66da81c112a6', 'Bazzy', 'ANGRYCARROTIS69', 'angrycarrotis69@gmail.com', NULL, 'Luma', true, '2026-10-10T04:09:37.209Z'),
    ('13333342-5d89-5cb7-9e9a-90e165379b71', 'Bhanu teja', 'BGANIPE', 'bganipe@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T18:49:35.580Z'),
    ('256de5c5-a1e7-5141-8332-c0df3e76e7dc', 'Kaustubh Prasad', 'KPRASAD2', 'kprasad2@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T17:58:54.920Z'),
    ('e5fc1a13-8ac0-58ad-8d39-f09ad6ffac06', 'Mohammed Ashraf Tariq', 'AMOHAM18', 'amoham18@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T17:36:17.478Z'),
    ('0a68bae2-341d-5795-b0b1-d69ed392a7a7', 'Praneeth Chary Panuganti', 'PPANUGAN', 'ppanugan@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T17:16:52.907Z'),
    ('cb71b924-9a2c-5df4-865c-040670d23db0', 'Tejas Reddy', 'TEJASREDDYTHALLAPAKA1', 'tejasreddythallapaka1@gmail.com', NULL, 'Luma', true, '2026-10-09T16:04:01.906Z'),
    ('1544aae5-0db0-5252-85b1-b6f1bf7b1269', 'GOLLA SREEDHAR AKSHIT', 'AGOLLA1', 'agolla1@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T15:49:27.691Z'),
    ('c2c58962-a7a0-56bf-a480-193bbfe0efb9', 'Nikhil Peruka', 'NIKHILPERUKA7', 'nikhilperuka7@gmail.com', NULL, 'Luma', true, '2026-10-09T15:30:28.778Z'),
    ('8d0d46a4-ad55-53a0-b79b-900f668febf7', 'Ranga Sudhansh', 'SRANGA', 'sranga@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T14:52:50.329Z'),
    ('e615b095-0236-5d99-9037-7787f261d0a0', 'Bathina Arvind Kumar', 'ARVIND250206', 'arvind250206@gmail.com', NULL, 'Luma', true, '2026-10-09T14:10:16.088Z'),
    ('fae9945f-92e7-58a1-b306-ea314abe31f4', 'Saketh', 'VANNADAT', 'vannadat@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T13:45:55.987Z'),
    ('884ea52c-e96e-5fdf-b6a2-83853938983c', 'KALALI AVINASH', 'AKALALI2', 'akalali2@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T13:16:10.964Z'),
    ('511368cc-9cd2-56d9-9e81-743919490dea', 'Shourya', 'SHOURYA.CHARY', 'shourya.chary@gmail.com', NULL, 'Luma', true, '2026-10-09T13:07:06.684Z'),
    ('90ae6b0d-2d62-57f5-b5dd-e650c86c5117', 'Atla Divyesh Reddy', 'DIVYESHATLA', 'divyeshatla@gmail.com', NULL, 'Luma', true, '2026-10-09T12:58:40.913Z'),
    ('9405ef2a-19fe-5c9f-92ca-6a902547bcf6', 'Midhil Ch', 'CCHERUK2', 'ccheruk2@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T12:53:47.105Z'),
    ('4ae76a5b-89ff-5afe-8249-752ca9b367a4', 'Jayanth Kumar', 'JAYANTH0348P', 'jayanth0348p@gmail.com', NULL, 'Luma', true, '2026-10-09T12:01:42.313Z'),
    ('9b598fa4-a712-54ad-8efb-5ae12f6843fc', 'V JAYASHREE', 'JVENKAT2', 'jvenkat2@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T11:10:56.902Z'),
    ('fea74d75-d39f-5238-b19d-155311fb806f', 'THOTLA ABHINAV CHANDRA YADAV', 'ATHOTLA', 'athotla@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T10:55:34.390Z'),
    ('7418b1e8-7960-5f3b-b76c-2c23b3aab5ac', 'Sanvi', 'SPATHAP2', 'spathap2@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T10:55:23.106Z'),
    ('da79c65e-fe54-50e1-bbc7-334b910c96e5', 'T Naga Pranav', 'NP910890', 'np910890@gmail.com', NULL, 'Luma', true, '2026-10-09T10:29:14.974Z'),
    ('7657b10c-806e-54b8-a758-2ddeeade4c63', 'Shrey Dwivedi', 'SDWIVEDI', 'sdwivedi@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T09:15:59.574Z'),
    ('961d8f06-df62-5970-b90f-6d9f44d60b39', 'Sreyansh Acharya', 'SACHARYA', 'sacharya@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T09:14:31.489Z'),
    ('97e12860-55f1-50cc-bbee-a1f6c4a10532', 'V.kunal Anand', 'KVEERAV1', 'kveerav1@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T09:06:14.364Z'),
    ('ea0101fa-15dc-564c-89dd-dfa8609c0acc', 'Nigama', 'SNOMULA2', 'snomula2@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T08:56:07.307Z'),
    ('5a2b2337-6f2d-5568-a3e9-2ef2ceeff964', 'Eashanth Alli', 'EALLI', 'ealli@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T08:53:08.806Z'),
    ('742b357a-c51c-51fc-a617-4b6bde7f6f93', 'Muralidhar', 'MURALI07DHAR', 'murali07dhar@gmail.com', NULL, 'Luma', true, '2026-10-09T08:50:59.676Z'),
    ('d3d2ad65-ae83-5bb1-8e7c-525b2dbba1f2', 'Farhaan Ahmed', 'FARHAANAHMED5048', 'farhaanahmed5048@gmail.com', NULL, 'Luma', true, '2026-10-09T08:48:34.895Z'),
    ('43051ac9-fb03-50c5-9488-157a4255a22f', 'Gyaneshwari', 'GSALUKU2', 'gsaluku2@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T08:40:39.851Z'),
    ('c6a0866b-f6cb-5cb0-97cd-3fba4850c449', 'A.Somnath Aneesh', 'SAKUNUR2', 'sakunur2@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T08:32:46.925Z'),
    ('6ef951ce-1e90-54ed-bb39-0b7d7437b073', 'Alampalli Ishaan', 'IALAMPAL', 'ialampal@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T08:32:35.170Z'),
    ('f825a8dc-671e-5e44-a652-02f5fe06b006', 'Gajula Shiva Priya', 'SGAJULA4', 'sgajula4@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T08:32:24.626Z'),
    ('47e12c14-80e9-535e-a917-406e78bcedbd', 'Vishnu', 'VVARAGAN', 'vvaragan@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T08:30:05.759Z'),
    ('62e12dde-8103-514d-bf5f-1dea416bf1dd', 'Rithvik Ch', 'SCHERUK3', 'scheruk3@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T08:13:56.161Z'),
    ('9c396eb8-3657-5b9a-9a31-dce7801cc0b6', 'Siddha Madishetti', 'SIDDHAMADISHETTI08', 'siddhamadishetti08@gmail.com', NULL, 'Luma', true, '2026-10-09T08:12:40.618Z'),
    ('7fe10c0d-4e44-54c5-8128-8b16fd2e5d50', 'Abhijit', 'SGUDIPA2', 'sgudipa2@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T08:12:10.840Z'),
    ('9a712f13-3bfa-5eee-97aa-11fd7cca6c74', 'Deepak M', 'KMUKTHAV', 'kmukthav@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T08:12:01.773Z'),
    ('fac6577e-5e74-59a6-9fdd-1c81c5ca06be', 'M Jeshith', 'JMEKALA', 'jmekala@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T07:54:11.204Z'),
    ('77f921c1-a2fe-5669-b62d-0d8911864764', 'shubham kumar', 'SKUMAR14', 'skumar14@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T07:51:43.848Z'),
    ('d686902b-005e-5ed8-a352-2d2e2b096d7c', 'ujwal kandukuri', 'UJWALKANDUKURI1', 'ujwalkandukuri1@gmail.com', NULL, 'Luma', true, '2026-10-09T07:40:41.302Z'),
    ('f0aa4a91-bd24-51e3-920e-c869c995738f', 'Tshedup Ghissing', 'TGHISSIN', 'tghissin@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T07:39:52.207Z'),
    ('12446340-68ca-5f9f-93a8-5f13794e0800', 'Jush', 'JUSHSHAH4', 'jushshah4@gmail.com', NULL, 'Luma', true, '2026-10-09T07:30:21.863Z'),
    ('60aae632-80a8-5450-9ee9-63abd19647e7', 'Ansh Konda', 'ANSH957072', 'ansh957072@gmail.com', NULL, 'Luma', true, '2026-10-09T07:23:40.468Z'),
    ('c3654e3f-97d2-5a9b-b0ff-fe356284a349', 'Manas Kasina', 'SKASINA1', 'skasina1@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T07:23:40.129Z'),
    ('7296d27d-fd80-51c4-a629-ff7153f1f4e5', 'Srihitha Pichika', 'SPICHIK2', 'spichik2@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T07:22:12.411Z'),
    ('608919b9-74b7-5d08-b1bf-613629c02c9a', 'Samuel', 'SURAGANASAMUELVIJAYKUMAR', 'suraganasamuelvijaykumar@gmail.com', NULL, 'Luma', true, '2026-10-09T07:22:08.510Z'),
    ('67ed318d-f1f7-5e66-b807-04e06d002b6b', 'M.S.S.Mukunda Reddy', 'SMEDAPAT', 'smedapat@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T07:15:19.561Z'),
    ('9c8d9a77-7d6a-5e7e-a5d9-e4f43e311145', 'Kirti', 'KARORA', 'karora@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T06:59:13.240Z'),
    ('8f0d7ea3-2baa-5088-934e-85f16148f4ed', 'Sushanth', 'SAM.SUSHANTH26', 'sam.sushanth26@gmail.com', NULL, 'Luma', true, '2026-10-09T05:20:00.518Z'),
    ('3a345fdc-9805-5e4d-9916-31d937681b5f', 'sai pranav', 'SCIDDAM', 'sciddam@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T05:18:32.316Z'),
    ('6663a3eb-845a-52a3-95ac-3d0c8952df10', 'Divye Das', 'DIVYE.DAS', 'divye.das@gmail.com', NULL, 'Luma', true, '2026-10-09T05:05:41.246Z'),
    ('20609ba7-41a5-5ab8-b329-bc63504a082a', 'K Siddharth', 'SKATIKAR', 'skatikar@student.gitam.edu', NULL, 'Luma', true, '2026-10-09T00:18:26.863Z'),
    ('1d0270c2-7af2-51ec-8077-63752810ea46', 'Arun sai', 'AMARAM', 'amaram@student.gitam.edu', NULL, 'Luma', true, '2026-10-08T18:21:52.090Z'),
    ('a65c853e-7117-5d3d-a1e8-faaffb74f4ee', 'SAI HARSHA ALLIKA', 'ALLIKASAIHARSHA1', 'allikasaiharsha1@gmail.com', NULL, 'Luma', true, '2026-10-08T18:20:15.398Z'),
    ('9f6981a8-edf0-5e33-be11-ea0b79f83973', 'Mahit', 'MCHILUVE', 'mchiluve@student.gitam.edu', NULL, 'Luma', true, '2026-10-08T17:16:04.571Z'),
    ('47247371-f4c5-5119-958a-b13fd96f22b6', 'G. Praneeth', 'PGADDE', 'pgadde@student.gitam.edu', NULL, 'Luma', true, '2026-10-08T17:12:15.583Z'),
    ('7abedb80-c8a1-5e7b-acc7-fa24a4734d44', 'Manne Rajeev', 'RMANNE', 'rmanne@student.gitam.edu', NULL, 'Luma', true, '2026-10-08T16:19:21.959Z'),
    ('ec022713-dcb8-532c-8244-90b9f23740df', 'Chaitanya', 'CHAITANYABULUSU3', 'chaitanyabulusu3@gmail.com', NULL, 'Luma', true, '2026-10-08T16:07:50.947Z'),
    ('f8f90e98-473c-56c9-8d2b-271478bf5e2a', 'Ankur Shukla', 'ANKUR.SHUKLA8702', 'ankur.shukla8702@gmail.com', NULL, 'Luma', true, '2026-10-04T08:47:22.666Z'),
    ('2d681ff7-7d15-501c-a939-897e2d46efe0', 'SRI SHASHANK PYDI', 'SHASHANK.PYDI', 'shashank.pydi@gmail.com', NULL, 'Luma', true, '2026-10-04T08:31:31.669Z')
ON CONFLICT (university_roll_number) DO NOTHING;
