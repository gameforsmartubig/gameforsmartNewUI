"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, forwardRef } from "react";
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

import { useSearchParams, useRouter } from "next/navigation";

// const DUMMY_USERS: Profile[] = [
//   { id: "1", username: "alex_g", fullname: "Alex Garrett", nickname: "Alex", avatar_url: null, country_id: null, state_id: null, city_id: null, cities: { name: "New York" }, states: { name: "NY" }, countries: { name: "USA" } },
//   { id: "2", username: "sarah_m", fullname: "Sarah Miller", nickname: "Sarah", avatar_url: null, country_id: null, state_id: null, city_id: null, cities: { name: "Los Angeles" }, states: { name: "CA" }, countries: { name: "USA" } },
//   { id: "3", username: "jhon_d", fullname: "Jhon Doe", nickname: "Jhon", avatar_url: null, country_id: null, state_id: null, city_id: null, cities: { name: "Chicago" }, states: { name: "IL" }, countries: { name: "USA" } },
//   { id: "4", username: "emily_r", fullname: "Emily Rose", nickname: "Em", avatar_url: null, country_id: null, state_id: null, city_id: null, cities: { name: "Houston" }, states: { name: "TX" }, countries: { name: "USA" } },
//   { id: "5", username: "michael_b", fullname: "Michael Brown", nickname: "Mike", avatar_url: null, country_id: null, state_id: null, city_id: null, cities: { name: "Phoenix" }, states: { name: "AZ" }, countries: { name: "USA" } },
// ];

export function Friends({ currentUserId }: { currentUserId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "friends";

  const [activeTab, setActiveTabState] = useState(initialTab);
  const [loading, setLoading] = useState(false);

  // Sync state with URL
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    router.push(`?tab=${tab}`);
  };

  // Data States
  const [users, setUsers] = useState<Profile[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      const triggerSearch = () => {
        e.preventDefault();
        const input = document.getElementById("friends-search-input");
        if (input) {
          input.focus();
        } else if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      };

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        triggerSearch();
        return;
      }

      if (e.key.toLowerCase() === "k" && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        triggerSearch();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
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

      // Fallback to dummy data if empty as requested
      // if (data.length === 0) {
      //   setUsers(DUMMY_USERS);
      // } else {
      setUsers(data);
      // }
    } catch (err) {
      console.error("Error fetching data:", err);
      // Fallback to dummy data on error too
      // setUsers(DUMMY_USERS);
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
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex items-center justify-between border-gray-100 dark:border-gray-800">
        <TabsList className="h-auto w-fit justify-start rounded-none bg-transparent p-0">
          {[
            { value: "friends", label: "Friends" },
            { value: "following", label: "Following" },
            { value: "follower", label: "Follower" },
            { value: "find", label: "Find People" }
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="tabs-trigger">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex w-full items-center justify-end sm:w-auto">
          <SearchFriends
            ref={searchInputRef}
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
    <Card className="border-card py-2">
      <div className="vertical-line" />
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
              <DialogContent className="dialog">
                <DialogHeader>
                  <DialogTitle className="text-orange-950 dark:text-orange-200">
                    Remove Follower
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove this follower?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRemoveFollower} className="button-orange">
                    Confirm
                  </Button>
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
            <Button variant="default" size="sm" onClick={handleFollow} className="button-orange">
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

export const SearchFriends = forwardRef<HTMLInputElement, SearchProps>(
  ({ activeTab, onSearch, locationFilter, setLocationFilter, onApplyFilter }, ref) => {
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="button-yellow">
              <Funnel className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-950 dark:text-orange-200">
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
              <Button
                variant="outline"
                onClick={handleResetLocation}
                className="button-yellow-outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <div className="flex items-center gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="default" onClick={handleApplyLocation} className="button-orange">
                    Apply
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="relative w-full flex-1 sm:w-auto sm:flex-none">
          <Input
            ref={ref}
            id="friends-search-input"
            placeholder={`Press K or Click to Search...`}
            className="pr-10 sm:w-[250px]"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
          />
          <Button
            onClick={handleSearchTrigger}
            className="button-orange absolute top-1 right-1 h-7 w-7">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

SearchFriends.displayName = "SearchFriends";
