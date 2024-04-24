FROM python:3.10-slim-buster

COPY requirements.txt requirements.txt
COPY ./diffusers ./diffusers

RUN pip3 install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cu116

COPY . .

CMD [ "python3", "-m" , "sanic", "server.app"]
