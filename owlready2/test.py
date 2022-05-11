from owlready2 import *
import pandas

onto = get_ontology("./ontology/football.owl")
onto.load()

dfPlayer = pandas.read_csv("./crawl-data/data/player.csv")
for index, row in dfPlayer.iterrows():
    player = onto.Player(row['name'].replace(" ", "_"))
    player.hasName = [row['name']]

onto.save('./ontology/football_test.owl')

print(onto.Player)