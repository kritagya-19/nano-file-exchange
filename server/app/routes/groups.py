from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from typing import List
import uuid

from app.database import get_db
from app.models.group import Group, GroupMember, GroupInvitation
from app.models.user import User
from app.schemas.group import GroupCreate, GroupResponse, GroupMemberAdd, GroupMemberResponse, InviteByEmail, InvitationResponse
from app.middleware.auth import get_current_user_id
from app.utils.email import send_invite_email

router = APIRouter()

@router.post("", response_model=GroupResponse)
def create_group(group: GroupCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Create group
    new_group = Group(group_name=group.group_name, created_by=user_id)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    # Auto-add creator as an approved member
    member = GroupMember(group_id=new_group.group_id, user_id=user_id, status="approved")
    db.add(member)
    db.commit()
    
    return new_group

@router.get("", response_model=List[GroupResponse])
def list_my_groups(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Groups where user is created_by OR is an approved member
    query = select(Group).join(GroupMember, Group.group_id == GroupMember.group_id, isouter=True).where(
        (Group.created_by == user_id) | ((GroupMember.user_id == user_id) & (GroupMember.status == "approved"))
    ).distinct()
    return db.scalars(query).all()

@router.get("/explore", response_model=List[GroupResponse])
def explore_groups(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Groups where user is NOT a member
    my_groups_subquery = select(GroupMember.group_id).where(GroupMember.user_id == user_id)
    query = select(Group).where(Group.group_id.not_in(my_groups_subquery))
    return db.scalars(query).all()

@router.get("/{group_id}", response_model=GroupResponse)
def get_group(group_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Get a single group's info. Only accessible by approved members or the creator."""
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Verify the requester is an approved member or the creator
    is_member = db.scalar(select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
        GroupMember.status == "approved"
    ))
    if not is_member and group.created_by != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this group")
    
    return group

@router.post("/{group_id}/join")
def join_group(group_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    group = db.scalar(select(Group).where(Group.group_id == group_id))
    if not group:
        raise HTTPException(status_code=404, detail="Invalid group code. Group not found.")
        
    existing = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    if existing:
        if existing.status == "pending":
            return {"status": "pending_approval", "message": "Your request is pending admin approval."}
        return {"status": "already joined", "message": "You are already a member of this group."}
        
    new_member = GroupMember(group_id=group_id, user_id=user_id, status="pending")
    db.add(new_member)
    db.commit()
    return {"status": "request_sent", "message": "Request sent to admin for approval."}

@router.get("/{group_id}/requests", response_model=List[GroupMemberResponse])
def get_group_requests(group_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    group = db.scalar(select(Group).where(Group.group_id == group_id, Group.created_by == user_id))
    if not group:
        raise HTTPException(status_code=403, detail="Only admins can view requests.")
        
    query = select(GroupMember, User).join(User, GroupMember.user_id == User.user_id).where(
        GroupMember.group_id == group_id, GroupMember.status == "pending"
    )
    results = db.execute(query).all()
    
    return [
        GroupMemberResponse(
            id=member.id,
            group_id=member.group_id,
            user_id=member.user_id,
            name=user.name,
            status=member.status,
            joined_at=member.joined_at
        ) for member, user in results
    ]

@router.post("/{group_id}/requests/{target_user_id}/approve")
def approve_request(group_id: int, target_user_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    group = db.scalar(select(Group).where(Group.group_id == group_id, Group.created_by == user_id))
    if not group:
        raise HTTPException(status_code=403, detail="Only admins can approve requests.")
        
    member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == target_user_id))
    if not member:
        raise HTTPException(status_code=404, detail="Request not found.")
        
    member.status = "approved"
    db.commit()
    return {"status": "approved"}

@router.post("/{group_id}/requests/{target_user_id}/reject")
def reject_request(group_id: int, target_user_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    group = db.scalar(select(Group).where(Group.group_id == group_id, Group.created_by == user_id))
    if not group:
        raise HTTPException(status_code=403, detail="Only admins can reject requests.")
        
    member = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == target_user_id))
    if not member:
        raise HTTPException(status_code=404, detail="Request not found.")
        
    db.delete(member)
    db.commit()
    return {"status": "rejected"}

@router.get("/{group_id}/members", response_model=List[GroupMemberResponse])
def get_group_members(group_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Verify the requester is an APPROVED member or the group creator
    is_member = db.scalar(select(GroupMember).where(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
        GroupMember.status == "approved"
    ))
    if not is_member:
        group = db.scalar(select(Group).where(Group.group_id == group_id))
        if not group or group.created_by != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    query = select(GroupMember, User).join(User, GroupMember.user_id == User.user_id).where(
        GroupMember.group_id == group_id, GroupMember.status == "approved"
    )
    results = db.execute(query).all()
    
    return [
        GroupMemberResponse(
            id=member.id,
            group_id=member.group_id,
            user_id=member.user_id,
            name=user.name,
            status=member.status,
            joined_at=member.joined_at
        ) for member, user in results
    ]

@router.post("/{group_id}/members", response_model=GroupMemberResponse)
def add_member(group_id: int, payload: GroupMemberAdd, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Verify group exists and user has permission (is creator)
    group = db.scalar(select(Group).where(Group.group_id == group_id, Group.created_by == user_id))
    if not group:
        raise HTTPException(status_code=403, detail="Not authorized or group not found")
        
    # Check if user to add exists
    user_to_add = db.scalar(select(User).where(User.user_id == payload.user_id))
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if already a member
    existing = db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == payload.user_id))
    if existing:
        raise HTTPException(status_code=400, detail="User already in group")
        
    new_member = GroupMember(group_id=group_id, user_id=payload.user_id)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    return GroupMemberResponse(
        id=new_member.id,
        group_id=new_member.group_id,
        user_id=new_member.user_id,
        name=user_to_add.name,
        status=new_member.status,
        joined_at=new_member.joined_at
    )

@router.delete("/{group_id}")
def delete_group(group_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    group = db.scalar(select(Group).where(Group.group_id == group_id, Group.created_by == user_id))
    if not group:
        raise HTTPException(status_code=403, detail="Not authorized or group not found")

    # Force-delete message trees for deterministic cleanup even on older DBs.
    db.execute(text("DELETE FROM message_hides WHERE message_id IN (SELECT id FROM messages WHERE group_id = :gid)"), {"gid": group_id})
    db.execute(text("DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM messages WHERE group_id = :gid)"), {"gid": group_id})
    db.execute(text("DELETE FROM message_stars WHERE message_id IN (SELECT id FROM messages WHERE group_id = :gid)"), {"gid": group_id})
    db.execute(text("DELETE FROM messages WHERE group_id = :gid"), {"gid": group_id})

    db.delete(group)
    db.commit()
    return {"status": "success", "message": "Group deleted successfully"}


# ─── Email Invitation Routes ───────────────────────────────────────────

@router.post("/{group_id}/invite", response_model=InvitationResponse)
def invite_by_email(group_id: int, payload: InviteByEmail, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Invite a user to the group via email. Only the group creator can invite."""
    # 1. Verify group exists and requester is the creator
    group = db.scalar(select(Group).where(Group.group_id == group_id, Group.created_by == user_id))
    if not group:
        raise HTTPException(status_code=403, detail="Only the group admin can send invitations.")

    # 2. Check if the email is already a member (if user exists)
    target_user = db.scalar(select(User).where(User.email == payload.email))
    if target_user:
        existing_member = db.scalar(
            select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == target_user.user_id)
        )
        if existing_member and existing_member.status == "approved":
            raise HTTPException(status_code=400, detail="This user is already a member of the group.")

    # 3. Check for an existing pending invitation to avoid spam
    existing_invite = db.scalar(
        select(GroupInvitation).where(
            GroupInvitation.group_id == group_id,
            GroupInvitation.invited_email == payload.email,
            GroupInvitation.status == "pending"
        )
    )
    if existing_invite:
        raise HTTPException(status_code=400, detail="An invitation has already been sent to this email.")

    # 4. Create the invitation
    invite_token = uuid.uuid4().hex
    invitation = GroupInvitation(
        group_id=group_id,
        invited_email=payload.email,
        invite_token=invite_token,
        invited_by=user_id
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    # 5. Get inviter name for the email
    inviter = db.scalar(select(User).where(User.user_id == user_id))
    inviter_name = inviter.name if inviter else "Someone"

    # 6. Send the email
    email_sent = send_invite_email(
        to_email=payload.email,
        group_name=group.group_name,
        inviter_name=inviter_name,
        invite_token=invite_token
    )
    
    if not email_sent:
        # Still create the invitation even if email fails — admin can share link manually
        pass

    return invitation


@router.post("/invite/{token}/accept")
def accept_invitation(token: str, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Accept a group invitation using the token. Requires authentication."""
    # 1. Find the invitation
    invitation = db.scalar(
        select(GroupInvitation).where(GroupInvitation.invite_token == token, GroupInvitation.status == "pending")
    )
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or has already been used.")

    # 2. Verify the logged-in user's email matches the invitation
    current_user = db.scalar(select(User).where(User.user_id == user_id))
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if current_user.email.lower() != invitation.invited_email.lower():
        raise HTTPException(status_code=403, detail="This invitation was sent to a different email address.")

    # 3. Check if already a member
    existing = db.scalar(
        select(GroupMember).where(GroupMember.group_id == invitation.group_id, GroupMember.user_id == user_id)
    )
    if existing:
        if existing.status == "approved":
            invitation.status = "accepted"
            db.commit()
            return {"status": "already_member", "group_id": invitation.group_id, "message": "You are already a member of this group."}
        else:
            existing.status = "approved"
            invitation.status = "accepted"
            db.commit()
            return {"status": "approved", "group_id": invitation.group_id, "message": "You have joined the group!"}

    # 4. Add user to the group as approved member
    new_member = GroupMember(group_id=invitation.group_id, user_id=user_id, status="approved")
    db.add(new_member)
    invitation.status = "accepted"
    db.commit()

    return {"status": "joined", "group_id": invitation.group_id, "message": "You have successfully joined the group!"}


@router.get("/invite/{token}/info")
def get_invitation_info(token: str, db: Session = Depends(get_db)):
    """Public endpoint to get basic invitation info (group name, inviter) — no auth required."""
    invitation = db.scalar(
        select(GroupInvitation).where(GroupInvitation.invite_token == token, GroupInvitation.status == "pending")
    )
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or has expired.")

    group = db.scalar(select(Group).where(Group.group_id == invitation.group_id))
    inviter = db.scalar(select(User).where(User.user_id == invitation.invited_by))

    return {
        "group_name": group.group_name if group else "Unknown Group",
        "inviter_name": inviter.name if inviter else "Someone",
        "invited_email": invitation.invited_email
    }

