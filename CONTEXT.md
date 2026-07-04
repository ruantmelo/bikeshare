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

**Bicycle Status**:
The user-facing availability condition of a Bicycle, such as unregistered, available, reserved, in use, or error.
_Avoid_: State, firmware state

**Unregistered Bicycle**:
A Bicycle known by BikeShare UFAL but not yet reporting as configured and available from firmware.
_Avoid_: Unknown bike, missing device

**Reserved Bicycle**:
A Bicycle authorized for a User's Ride but not yet in active use.
_Avoid_: Held bike, pending rental

**User Location**:
The User's foreground device position used to center nearby Bicycle discovery while the app screen is open.
_Avoid_: Background tracking, live navigation location

**Ride**:
The period of Bicycle use started by a User and recorded by BikeShare UFAL until the User finishes it.
_Avoid_: Rental, rent flow, trip

**Ride Status**:
The lifecycle condition of a Ride as reserved, in use, completed, cancelled, or expired.
_Avoid_: Ride state, rental status

**Telemetry**:
The latest observed facts reported by a Bicycle, including its status, position, motion, speed, and runtime health when available.
_Avoid_: Logs, raw messages, sensor dump

**Bicycle Event**:
A discrete occurrence involving a Bicycle that explains a status change, physical interaction, connectivity change, error, or rejected command.
_Avoid_: Log entry, telemetry event, raw message
