# Poster Trace

Poster Trace lets a user run poster campaigns: they design posters carrying a QR code, and every scan of that code sends the scanner to the campaign's target, so the user can see where and how often their posters are scanned.

## Language

### Campaigns

**Campaign**:
An advertising campaign run by a user: one target, promoted through any number of poster designs. It's the core concept, and the same word is used in every layer.
_Avoid_: Poster campaign, project, promotion

**Owner**:
The user a campaign belongs to. Only the owner can see or change a campaign.
_Avoid_: Creator, author

**Target**:
The http(s) URL that a scan of any of the campaign's posters sends the scanner to.
_Avoid_: Destination, redirect URL, link

### Designs

**Poster Design**:
One layout for a campaign's posters: an uploaded one-page, portrait A4 PDF with a QR code placed on it. It belongs to exactly one campaign.
_Avoid_: Design image, template

**QR Placement**:
Where the QR code sits on a poster design: its `x` and `y` position, `size` and `rotation`.
_Avoid_: QR position, QR settings

### Posters and scans

Registrations and scans aren't built yet.

**Poster**:
One copy of a poster design with its own QR code, so that scans can be traced back to it. A poster exists from the moment it's generated, as a page of a PDF the user prints and puts up. It is **registered** once the user logs where it has been put up.
_Avoid_: Using "poster" to mean a poster design

**Generate**:
To make new posters from a poster design, ready to print.
_Avoid_: Create, print, issue (when you mean making posters)

**Registration**:
The moment the user logs where a poster has been put up. A poster is **registered** once its location has been logged, and not before.
_Avoid_: Activation, placement

**Scan**:
One reading of a poster's QR code, recorded at the time it happened.
_Avoid_: Visit, hit, click

### Accounts

**User**:
A person with a Poster Trace account. Who they are and how they sign in belong to the authentication provider; Poster Trace only knows a user's id, name and email and what they own.
_Avoid_: Account (when you mean the person), customer
