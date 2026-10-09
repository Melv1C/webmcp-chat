# Glossary

## Host page

The page that embeds WebMCP Chat and makes page-specific tools available to it. In this repo the host is `apps/demo`.

## Page tool

An action the host page registers for the assistant. The chat widget discovers those tools; it does not own them.

## Chat widget

The embeddable floating chat. It ships as the `<webmcp-chat>` custom element from `apps/web`, which mounts an iframe of the widget origin.

## WebMCP Chat

The chat application described by this repository. Its planned role is to let a user talk with an assistant that can use tools made available by the current host page.
