import styled from "styled-components";

import React from "react";

export default function List({children}) {
  return (
      <ListWrapper>
        {children.map((child, index) =>
          <ListItem key={index}>
            <ListItemContent>
              {child}
            </ListItemContent>
          </ListItem>
        )}
      </ListWrapper>
  );
}

const ListWrapper = styled.ol`
  padding-left: 68px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`

const ListItem = styled.li`
  max-width: 40ch;
  &::marker{
    color: var(--color-green-950);

    font-size: ${64/16}rem;
  }
`
const ListItemContent = styled.span`
  position: relative;
  top: -16px;
  color: var(--color-green-950);
`