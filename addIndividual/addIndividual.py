from owlready2 import *
import pandas
from datetime import datetime
import math

# Tên viết tắt và tên đầy đủ
abbreviationToNameTeam = {
    "Brighton": "Brighton and Hove Albion",
    "Leeds": "Leeds United",
    "Leicester": "Leicester City",
    "Man City": "Manchester City",
    "Man Utd": "Manchester United",
    "Newcastle": "Newcastle United",
    "Norwich": "Norwich City",
    "Spurs": "Tottenham Hotspur",
    "West Ham": "West Ham United",
    "Wolves": "Wolverhampton Wanderers"
}

def getTeamNameFromAbbreviation(abbTeamName):
    try:
        return abbreviationToNameTeam[abbTeamName]
    except:
        return abbTeamName


# Load ontology
onto = get_ontology("./ontology/football.owl")
onto.load()


# Add stadium individual
dfStadium = pandas.read_csv("./crawl-data/data/stadium.csv")
for index, row in dfStadium.iterrows():
    stadium = onto.Stadium(row['name'].replace(" ", "_"))
    stadium.hasName = [row['name']]
    stadium.hasCapacity = [row['capacity']]
    stadium.hasBuiltYear = [row['builtYear']]
    stadium.hasPitchSize = [row['pitchSize']]
    stadium.hasAddress = [row['address']]
    stadium.hasPhone = [row['phone']]
    tempCity = row['address'].split(',')[-2].strip()
    city = onto.City(tempCity.replace(" ", "_") + '_city')
    city.hasName = [tempCity]
    city.belongToCountry = [onto.Country('England')]
    stadium.belongToCity = [city]

# Add team individual
dfTeam = pandas.read_csv("./crawl-data/data/club.csv")
for index, row in dfTeam.iterrows():
    team = onto.Team(row['name'].replace(" ", "_"))
    team.hasName = [row['name']]
    team.hasStadium = [onto.Stadium(row['stadium'].replace(" ", "_"))]
    team.hasWebsite = [row['website']]
    team.hasMatchNumber = [int(row['matchNumber'])]
    team.hasWinMatchNumber = [int(row['winMatchNumber'])]
    team.hasLossMatchNumber = [int(row['lossMatchNumber'])]
    team.hasGoal = [int(row['goal'])]
    team.hasGoalConceded = [int(row['goalConceded'])]
    team.hasCleanSheetMatch = [int(row['cleanSheetMatch'])]

# Add match individual
dfMatch = pandas.read_csv("./crawl-data/data/match.csv")
for index, row in dfMatch.iterrows():
    match = onto.Match(row['homeTeam'].replace(" ", "_") + "-" + row['guestTeam'].replace(" ", "_") + "-" + str(index))
    match.hasScore = [row['score']]
    match.hasHomeTeam = [onto.Team(getTeamNameFromAbbreviation(row['homeTeam']).replace(" ", "_"))]
    match.hasGuestTeam = [onto.Team(getTeamNameFromAbbreviation(row['guestTeam']).replace(" ", "_"))]
    match.atStadium = [onto.Stadium(row['stadium'].replace(" ", "_"))]
    match.matchOfLeague = [onto.League("Premier_League")]
    match.hasMatchDay = [datetime.strptime(row['matchDay'], '%A %d %B %Y').strftime('%Y-%m-%d')]

# Add coach individual
dfCoach = pandas.read_csv("./crawl-data/data/coach.csv")
for index, row in dfCoach.iterrows():
    coach = onto.Coach(row['name'].replace(" ", "_"))
    coach.sameAs = ['Test']
    coach.hasName = [row['name']]
    coach.hasBirthday = [row['birthday']]
    if type(row['dateJoinClub']) != float:
        coach.hasDateJoinClub = [row['dateJoinClub']]
    coach.hasCountSeason = [row['countSeason']]
    coach.hasMatchNumber = [row['matchNumber']]
    coach.hasWinMatchNumber = [row['winMatchNumber']]
    coach.hasLossMatchNumber = [row['lossMatchNumber']]
    coach.hasNationality = [onto.Country(row['country'].replace(" ", "_"))]
    if type(row['team']) != float:
        coach.coachOf = [onto.Team(row['team'].replace(" ", "_"))]
    

# Add player individual
dfPlayer = pandas.read_csv("./crawl-data/data/player.csv")
for index, row in dfPlayer.iterrows():
    player = onto.Player(row['name'].replace(" ", "_"))
    player.hasName = [row['name']]
    if type(row['birthday']) != float:
        tempBirthday = datetime.strptime(row['birthday'].split(' (')[0], "%d/%m/%Y").strftime('%Y-%m-%d')
        player.hasBirthday = [tempBirthday]
    if type(row['height']) != float:
        player.hasHeight = [int(row['height'])]
    if type(row['weight']) != float:
        player.hasWeight = [int(row['weight'])]
    player.hasMatchNumber = [int(row['matchNumber'])]
    player.hasWinMatchNumber = [int(row['winMatchNumber'])]
    player.hasLossMatchNumber = [int(row['lossMatchNumber'])]
    player.hasRedCardNumber = [int(row['redCardNumber'])]
    player.hasYellowCardNumber = [int(row['yellowCardNumber'])]
    player.hasFoulNumber = [int(row['foulNumber'])]
    player.hasGoal = [int(row['goal'])]
    tempTeam = onto.Team(row['team'].split('(')[0].replace('&', 'and').replace('U21', '').strip().replace(" ", "_"))
    player.playAtTeam = [tempTeam]
    player.playAtPosition = [onto.Position(row['position'])]
    player.hasNationality = [onto.Country(row['country'].replace(" ", "_"))]
    tempTeam.teamOf.append(player)


# Lưu ra file
onto.save('./ontology/football_add_individual.owl')

print("Add individual successfully!")