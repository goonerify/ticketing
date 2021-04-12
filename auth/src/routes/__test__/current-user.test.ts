import request from "supertest";
import { app } from "../../app";

it("responds with details about the current user", async () => {
  const cookie = await global.signin();

  const response = await request(app)
    .get("/api/users/currentuser")
    .set("Cookie", cookie)
    .send()
    .expect(200);

  expect(response.body.currentUser.email).toEqual("test@test.com");
});

// Remove requireAuth middleware in current-user.ts in order to use this test
// it("It responds with null if not authenticated", async () => {
//   const response = await request(app)
//     .get("/api/users/currentuser")
//     .send()
//     .expect(200);

//   // console.log(response.body);

//   expect(response.body.currentUser).toEqual(null);
//   expect(response.body.currentUser).toBeNull(); // Same expectation as above
// });

it("It responds with null if not authenticated", async () => {
  const response = await request(app)
    .get("/api/users/currentuser")
    .send()
    .expect(401);
});
