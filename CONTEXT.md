# BikeShare UFAL

BikeShare UFAL manages access to shared bicycles for UFAL users and records their bicycle rides.

## Language

**User**:
A person who uses the mobile app to access shared bicycles, identified by email and password.
_Avoid_: Account, customer

**Bicycle**:
A shared bicycle that can appear near the User and be selected for a ride.
_Avoid_: Bike, vehicle

**Nearby Bicycle**:
A Bicycle close enough to the User's current location to be shown as an available map option.
_Avoid_: Random bike, map marker

**User Location**:
The User's foreground device position used to center nearby Bicycle discovery while the app screen is open.
_Avoid_: Background tracking, live navigation location
