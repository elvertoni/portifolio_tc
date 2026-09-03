# Usar a imagem oficial e leve do Nginx baseada em Alpine Linux
FROM nginx:alpine

# Use the project config for compression, cache policy and security headers.
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar todos os arquivos do diretório atual (HTML, CSS, JS, Imagens) 
# para o diretório público padrão do Nginx
COPY . /usr/share/nginx/html

# Expor a porta 80, que é a porta padrão para tráfego HTTP web
EXPOSE 80

# Iniciar o servidor Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
