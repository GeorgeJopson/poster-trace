import styled from "styled-components";
import {QUERIES} from "@/constants";

const Header = styled.h2`
  font-weight: 400;
  font-family: var(--font-sora), sans-serif;
  text-align: center;
  
  font-size: ${64/16}rem;
  @media ${QUERIES.tabletAndDown} {
    font-size: ${48/16}rem;
  }
  @media ${QUERIES.phoneAndDown} {
    font-size: ${32/16}rem;
  }
`
export default Header;
