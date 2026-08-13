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
  padding-left: 64px;
`

const ListItem = styled.li`

  &::marker{
    color: var(--color-orange-950);

    font-size: ${64/16}rem;
  }
`
const ListItemContent = styled.span`
  position: relative;
  top: -16px;
`