# this didn't work, just leaving it here for reference

from tableauscraper import TableauScraper as TS
import datetime
import pandas as pd

url = "https://tableau.cornell.edu/t/IRP/views/PublicCOVID-19TrackingDashboard/COVID-19Tracking?:iid=1&:size=840,162&:embed=y&:showVizHome=n&:bootstrapWhenNotified=y&:tabs=n&:toolbar=n&:device=desktop&:apiID=host1#navType=1&navSrc=Parse"

ts = TS()
ts.loads(url)
workbook = ts.getWorkbook()

print(workbook.getParameters())

dates = ["10/25/2021", "9/16/2021"]

date_format = "%m/%d/%Y"

for date in dates:
    workbook.setParameter('Date slider', date)
    d = datetime.datetime.strptime(date, date_format)
    days = {}
    labels = ts.getWorksheet("labels")
    print(labels.data)
    for (count, day) in zip(labels.data['CNT(Migrated Data)-alias'], labels.data['Adjusted date-value']):
        date = d + datetime.timedelta(day)
        print(count, date)