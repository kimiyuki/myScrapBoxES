FROM docker.elastic.co/elasticsearch/elasticsearch:6.4.2

COPY sudachi/analysis-sudachi-elasticsearch6.4.2-1.1.0.zip /usr/share/elasticsearch/
RUN elasticsearch-plugin install file:///usr/share/elasticsearch/analysis-sudachi-elasticsearch6.4.2-1.1.0.zip
RUN bin/elasticsearch-plugin install analysis-kuromoji
COPY sudachi.json    /usr/share/elasticsearch/plugins/analysis-sudachi/
COPY system_core.dic /usr/share/elasticsearch/plugins/analysis-sudachi/
#below 2 lines may be duplicated config, but quick fix for plugin error
RUN mkdir /usr/share/elasticsearch/sudachi
COPY system_core.dic /usr/share/elasticsearch/sudachi/



