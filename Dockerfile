# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Placeholder page — repo has no application source yet; deploy pipeline is validating end-to-end wiring.
RUN rm -f /usr/share/nginx/html/index.html
COPY index.html /usr/share/nginx/html/index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
