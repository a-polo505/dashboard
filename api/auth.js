export function isValidToken(requestToken) {
    const expectedToken = `Bearer ${process.env.API_TOKEN}`;
    return requestToken === expectedToken;
  }
  