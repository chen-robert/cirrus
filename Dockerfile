FROM node:10

RUN apt-get update && \
  apt-get install -y libcap-dev default-jre default-jdk && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/ioi/isolate && cd isolate && make isolate && mv isolate /usr/bin && mv default.cf /usr/local/etc/isolate

ENV JAVA_HOME /usr/lib/jvm/java-7-openjdk-amd64

RUN mkdir /app
WORKDIR /app

COPY package*.json ./

RUN npm ci 

COPY . .

RUN mkdir -p /app/uploads/tests
RUN cp -r /app/samples/tests /app/uploads/tests

ENV NODE_ENV production

CMD ["node", "index.js"]
