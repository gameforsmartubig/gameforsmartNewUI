"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Funnel,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash,
  User,
  MapPin,
  Check,
  EllipsisVertical
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { LocationSelector, type LocationValue } from "@/components/ui/location-selector";
import { toast } from "sonner";

// Define Profile Type based on table structure
interface Profile {
  id: string;
  username: string;
  fullname: string | null;
  nickname: string | null;
  avatar_url: string | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  countries?: { name: string } | null;
  states?: { name: string } | null;
  cities?: { name: string } | null;
}

export function Friends({ currentUserId }: { currentUserId: string }) {
  const [activeTab, setActiveTab] = useState("friends");
  const [loading, setLoading] = useState(false);

  // Data States
  const [users, setUsers] = useState<Profile[]>([]);
  // Track followed users for "Find People" tab and "Follower" tab
  const [followedIds, setFollowedIds] = useState<string[]>([]);

  // Search States per tab
  const [searchQueries, setSearchQueries] = useState({
    friends: "",
    following: "",
    follower: "",
    find: ""
  });

  // Location Filter State (per tab)
  const initialLocationFilter: LocationValue = {
    countryId: null,
    stateId: null,
    cityId: null,
    countryName: "",
    stateName: "",
    cityName: "",
    latitude: null,
    longitude: null
  };

  const [locationFilters, setLocationFilters] = useState<Record<string, LocationValue>>({
    friends: { ...initialLocationFilter },
    following: { ...initialLocationFilter },
    follower: { ...initialLocationFilter },
    find: { ...initialLocationFilter }
  });

  const currentLocationFilter = locationFilters[activeTab as keyof typeof locationFilters];

  const handleSearch = (query: string) => {
    setSearchQueries((prev) => ({ ...prev, [activeTab]: query }));
  };

  const updateLocationFilter = (val: LocationValue) => {
    setLocationFilters((prev) => ({ ...prev, [activeTab]: val }));
  };

  const fetchData = async () => {
    setLoading(true);
    setUsers([]);

    try {
      // Cast activeTab to a known key of both objects to satisfy TS index signature
      // The state initialization ensures keys match.
      const currentTab = activeTab as keyof typeof locationFilters;
      // We also need to ensure it matches searchQueries keys if they differ, but here they seem to align.
      // If searchQueries has same structure:
      const currentSearch = searchQueries[currentTab as keyof typeof searchQueries] || "";
      const currentFilter = locationFilters[currentTab];

      let data: Profile[] = [];
      let profileIds: string[] = [];

      // Pre-fetch followed IDs for "Find People" tab AND "Follower" tab (for checking follow-back status)
      if (activeTab === "find" || activeTab === "follower") {
        const { data: followedData } = await supabase
          .from("friendships")
          .select("addressee_id")
          .eq("requester_id", currentUserId);

        const ids = followedData?.map((item) => item.addressee_id) || [];
        setFollowedIds(ids);
      } else {
        setFollowedIds([]);
      }

      // 1. Determine IDs based on relationship for other tabs
      if (activeTab === "friends") {
        const { data: following } = await supabase
          .from("friendships")
          .select("addressee_id")
          .eq("requester_id", currentUserId);
        const { data: followers } = await supabase
          .from("friendships")
          .select("requester_id")
          .eq("addressee_id", currentUserId);
        const followingIds = following?.map((f) => f.addressee_id) || [];
        const followerIds = followers?.map((f) => f.requester_id) || [];
        profileIds = followingIds.filter((id) => followerIds.includes(id));
      } else if (activeTab === "following") {
        const { data: following } = await supabase
          .from("friendships")
          .select("addressee_id")
          .eq("requester_id", currentUserId);
        profileIds = following?.map((f) => f.addressee_id) || [];
      } else if (activeTab === "follower") {
        const { data: followers } = await supabase
          .from("friendships")
          .select("requester_id")
          .eq("addressee_id", currentUserId);
        profileIds = followers?.map((f) => f.requester_id) || [];
      }

      // 2. Query Profiles
      let query = supabase.from("profiles").select(`
        *,
        countries (name),
        states (name),
        cities (name)
      `);

      if (activeTab === "find") {
        // Exclude self in find
        query = query.neq("id", currentUserId);
      } else {
        if (profileIds.length === 0) {
          setUsers([]);
          return;
        }
        query = query.in("id", profileIds);
      }

      // 3. Apply Common Search & Filters
      if (currentSearch) {
        query = query.or(
          `username.ilike.%${currentSearch}%,fullname.ilike.%${currentSearch}%,nickname.ilike.%${currentSearch}%`
        );
      }

      if (currentFilter.countryId) query = query.eq("country_id", currentFilter.countryId);
      if (currentFilter.stateId) query = query.eq("state_id", currentFilter.stateId);
      if (currentFilter.cityId) query = query.eq("city_id", currentFilter.cityId);

      const { data: res, error } = await query;
      if (error) {
        console.error("Query Error:", error);
        throw error;
      }

      data = (res as any) || [];
      setUsers(data);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    activeTab,
    searchQueries[activeTab as keyof typeof searchQueries],
    locationFilters[activeTab as keyof typeof locationFilters]
  ]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
      <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
        <TabsList className="flex w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="follower">Follower</TabsTrigger>
          <TabsTrigger value="find">Find People</TabsTrigger>
        </TabsList>
        <div className="hidden w-full items-center justify-end sm:flex sm:w-auto">
          <SearchFriends
            activeTab={activeTab}
            onSearch={handleSearch}
            locationFilter={currentLocationFilter}
            setLocationFilter={updateLocationFilter}
            onApplyFilter={() => {}}
          />
        </div>
      </div>

      {["friends", "following", "follower", "find"].map((tab) => (
        <TabsContent key={tab} value={tab} className="space-y-4">
          <div className="sm:hidden">
            <SearchFriends
              activeTab={activeTab}
              onSearch={handleSearch}
              locationFilter={currentLocationFilter}
              setLocationFilter={updateLocationFilter}
              onApplyFilter={() => {}}
            />
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  tab={tab}
                  currentUserId={currentUserId}
                  onActionComplete={fetchData}
                  isFollowing={
                    (activeTab === "find" || activeTab === "follower") &&
                    followedIds.includes(user.id)
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function UserCard({
  user,
  tab,
  currentUserId,
  onActionComplete,
  isFollowing = false
}: {
  user: Profile;
  tab: string;
  currentUserId: string;
  onActionComplete: () => void;
  isFollowing?: boolean;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleFollow = async () => {
    try {
      await supabase.from("friendships").insert({
        requester_id: currentUserId,
        addressee_id: user.id,
        status: "accepted"
      });
      toast.success(`Followed ${user.username}`);
      onActionComplete();
    } catch (e) {
      toast.error("Failed to follow");
    }
  };

  const handleUnfollow = async () => {
    try {
      await supabase
        .from("friendships")
        .delete()
        .eq("requester_id", currentUserId)
        .eq("addressee_id", user.id);
      toast.success(`Unfollowed ${user.username}`);
      onActionComplete();
    } catch (e) {
      toast.error("Failed to unfollow");
    }
  };

  const handleRemoveFollower = async () => {
    try {
      await supabase
        .from("friendships")
        .delete()
        .eq("requester_id", user.id)
        .eq("addressee_id", currentUserId);
      toast.success("Removed follower");
      onActionComplete();
      setIsDeleteDialogOpen(false);
    } catch (e) {
      toast.error("Failed to remove follower");
    }
  };

  // Location display logic
  const locationParts = [user.cities?.name, user.states?.name, user.countries?.name].filter(
    Boolean
  );
  const locationString = locationParts.length > 0 ? locationParts.join(", ") : null;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-orange-500"></div>
      <CardContent className="flex flex-row items-center justify-between gap-4">
        <div>
          <img
            src={
              user.avatar_url ||
              "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            }
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col items-start overflow-hidden">
          <div
            title={user.fullname || user.username}
            className="text-md line-clamp-1 font-semibold break-words">
            {user.fullname || user.username}
          </div>
          <div className="text-muted-foreground line-clamp-1 text-sm font-medium break-words">
            {user.nickname && <span className="mr-1">{user.nickname}</span>}@{user.username}
          </div>
          {locationString && (
            <div
              className="text-muted-foreground line-clamp-1 text-xs break-words"
              title={locationString}>
              {locationString}
            </div>
          )}
        </div>

        {tab === "friends" && (
          <Button variant="secondary" size="sm" onClick={handleUnfollow}>
            Unfollow
          </Button>
        )}
        {tab === "following" && (
          <Button variant="secondary" size="sm" onClick={handleUnfollow}>
            Unfollow
          </Button>
        )}
        {tab === "follower" && (
          <div className="flex items-center gap-2">
            {isFollowing && (
              <span className="text-muted-foreground text-xs font-medium">Followed</span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <EllipsisVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isFollowing && (
                  <DropdownMenuItem onClick={handleFollow}>Follback</DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600">
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog controlled by state */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove Follower</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove this follower?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRemoveFollower}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        {tab === "find" &&
          (isFollowing ? (
            <Button variant="secondary" size="sm" disabled>
              <Check size={16} className="mr-1" /> Followed
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={handleFollow}>
              <Plus size={16} className="mr-1" /> Follow
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}

interface SearchProps {
  activeTab: string;
  onSearch: (query: string) => void;
  locationFilter: LocationValue;
  setLocationFilter: (val: LocationValue) => void;
  onApplyFilter: () => void;
}

export function SearchFriends({
  activeTab,
  onSearch,
  locationFilter,
  setLocationFilter,
  onApplyFilter
}: SearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [tempLocation, setTempLocation] = useState<LocationValue>(locationFilter);

  useEffect(() => {
    setInputValue("");
  }, [activeTab]);

  useEffect(() => {
    setTempLocation(locationFilter);
  }, [locationFilter]);

  const handleSearchTrigger = () => {
    onSearch(inputValue);
  };

  const handleApplyLocation = () => {
    setLocationFilter(tempLocation);
  };

  const handleResetLocation = () => {
    setTempLocation({
      countryId: null,
      stateId: null,
      cityId: null,
      countryName: "",
      stateName: "",
      cityName: "",
      latitude: null,
      longitude: null
    });
  };

  return (
    <div className="flex w-full items-center space-x-2">
      <div className="relative w-full flex-1 sm:w-auto sm:flex-none">
        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
        <Input
          placeholder={`Search ${activeTab}...`}
          className="pl-8 sm:w-[250px]"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
        />
        <button
          onClick={handleSearchTrigger}
          className="bg-primary text-primary-foreground hover:bg-primary/90 absolute top-1 right-1 ml-auto flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:cursor-pointer">
          <Search className="h-4 w-4" />
        </button>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Funnel className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Filter Location <MapPin size={16} />
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <LocationSelector
              value={tempLocation}
              onChange={setTempLocation}
              layout="vertical"
              showDetectButton={false}
            />
          </div>
          <DialogFooter className="flex w-full flex-row items-center justify-between sm:justify-between">
            <Button variant="outline" onClick={handleResetLocation}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <div className="flex items-center gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="default" onClick={handleApplyLocation}>
                  Apply
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
