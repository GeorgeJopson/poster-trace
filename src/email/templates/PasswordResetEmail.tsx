import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "react-email";

// Email clients don't load the app's stylesheets, so styles are inline. The
// colours are hex versions of the app's palette in src/app/global.css.
const colors = {
  green800: "#016630", // --color-green-800
  green900: "#0d542b", // --color-green-900
  green950: "#032e15", // --color-green-950
};

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily: "Nunito, Helvetica, Arial, sans-serif",
  color: colors.green950,
  margin: 0,
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  maxWidth: "440px",
  margin: "0 auto",
  padding: "32px",
};

const heading = {
  fontSize: "24px",
  lineHeight: "32px",
  margin: "0 0 16px",
};

const text = {
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const button = {
  backgroundColor: colors.green900,
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "12px 24px",
  textDecoration: "none",
};

const link = {
  color: colors.green800,
  wordBreak: "break-all" as const,
};

const note = {
  ...text,
  fontSize: "14px",
  lineHeight: "20px",
  margin: 0,
};

type Props = {
  name: string;
  url: string;
};

export default function PasswordResetEmail({ name, url }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your Poster Trace password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={heading}>
            Reset your password
          </Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Someone asked to reset the password for your Poster Trace account.
            Click the button below to choose a new one.
          </Text>
          <Text style={{ ...text, margin: "24px 0" }}>
            <Button href={url} style={button}>
              Reset password
            </Button>
          </Text>
          <Text style={text}>
            If the button doesn&apos;t work, copy this link into your browser:
            <br />
            <Link href={url} style={link}>
              {url}
            </Link>
          </Text>
          <Text style={note}>
            This link expires in 1 hour. If you didn&apos;t ask to reset your
            password, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

PasswordResetEmail.PreviewProps = {
  name: "Alex",
  url: "http://localhost:3000/api/auth/reset-password/example-token?callbackURL=http%3A%2F%2Flocalhost%3A3000%2Fpassword-reset%2Fauthorized",
} satisfies Props;
