default: help

SRC  := ../contracts
DST  := patched
DIFF := diff

DSTS  := $(wildcard $(DST)/**/*.sol)
DIFFS := $(wildcard $(DIFF)/*.patch)

###############################################################################
# Apply all patches in the $DIFF folder to the $DST folder
apply: $(DST) $(patsubst $(DIFF)/%.patch,$(DST)/%,$(subst _,/,$(DIFFS)))

# Reset the $DST folder
$(DST): FORCE
	@rm -rf $@
	@cp -r $(SRC) $@

# Update a solidity file in the $DST directory using the corresponding patch
$(DST)/%.sol: FORCE
	@echo Applying patch to $@
	@patch -p0 -d $(DST)/ < $(patsubst $(DST)_%,$(DIFF)/%.patch,$(subst /,_,$@))

###############################################################################
# Record all difference between $SRC and $DST in patches
record: $(DIFF) $(patsubst $(DST)_%,$(DIFF)/%.patch, $(subst /,_,$(DSTS)))

# Create the $DIFF folder
$(DIFF): FORCE
  @rm -rf $@
	@mkdir $@

# Create the patch file by comparing the source and the destination
$(DIFF)/%.patch: FORCE
	@echo Generating patch $@
	@diff -ruN \
		$(patsubst $(DIFF)/%.patch,$(SRC)/%,$(subst _,/,$@)) \
		$(patsubst $(DIFF)/%.patch,$(DST)/%,$(subst _,/,$@)) \
		| sed 's+$(SRC)/++g' \
		| sed 's+$(DST)/++g' \
		> $@
	@[ -s $@ ] || rm $@

###############################################################################
help:
	@echo "usage:"
	@echo "  make apply:  create $(DST) directory by applying the patches to $(SRC)"
	@echo "  make record: record the patches capturing the differences between $(SRC) and $(DST)"
	@echo "  make clean:  remove all generated files (those ignored by git)"

clean:
	git clean -fdX

FORCE: ;

