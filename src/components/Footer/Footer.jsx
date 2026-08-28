import React from 'react';
import styled from "styled-components";
import Logo from "@/components/Logo";
import Link from "next/link";
import CentralColumn from "@/components/CentralColumn";

export default function Footer() {
  return (
    <CentralColumn>
      <Wrapper>
        <Logo/>
        <LinkRow>
          <FooterLink href="/">Log In</FooterLink>
          <FooterLink href="/">Sign Up</FooterLink>
          <FooterLink href="/">Campaign Manager</FooterLink>
          <FooterLink href="/">Poster Activation</FooterLink>
          <FooterLink href="/">Analytics Dashboard</FooterLink>
        </LinkRow>
        <LinkRow>
          <FooterLink href="/">Contact</FooterLink>
          <FooterLink href="/">Privacy</FooterLink>
          <FooterLink href="/">Terms</FooterLink>
        </LinkRow>
      </Wrapper>
    </CentralColumn>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  gap: 8px;  
`
const LinkRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 20px;
  row-gap: 4px;
`

const FooterLink = styled(Link)`
  font-size: ${16/16}rem;
  color: var(--color-green-950);
  text-decoration: none;
`