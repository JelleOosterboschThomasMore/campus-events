// The slow mail server of the lab. Don't change this file.
export async function sendConfirmation(email, title) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(`mail sent to ${email}: you are registered for ${title}`);
}
