USE shoestore;

UPDATE users 
SET password='$2b$10$Z1mqNLxxNL9lIHCIkDntrupBA3iQkKj0MgGiGsU3TQME/ydj.UVx2' 
WHERE username='admin';

SELECT id, username, password, role, is_verified FROM users WHERE username='admin';
